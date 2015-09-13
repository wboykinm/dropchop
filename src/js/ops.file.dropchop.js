var dropchop = (function(dc) {
  
  'use strict';

  dc = dc || {};
  dc.ops = dc.ops || {};

  dc.ops.file = {
    upload: {
      description: 'Upload from your computer',
      icon: '<i class="fa fa-upload"></i>',
      execute: function() {
        // inspired from geojson.io
        // https://github.com/mapbox/geojson.io/blob/gh-pages/src/ui/file_bar.js#L390
        var $blindInput = $('<input>')
          .attr('type', 'file')
          .attr('multiple', 'true')
          .css('visibility', 'hidden')
          .css('position', 'absolute')
          .css('height', '0')
          .on('change', function() {
            var files = this.files;
            $(files).each(function(i) {
              dc.util.readFile(files[i]);
            });
            $blindInput.remove();
          });
        $('body').append($blindInput);
        $blindInput.click();
      }
    },

    'load-url': {
      description: 'Import file from a URL',
      icon: '<i class="fa fa-link"></i>',
      parameters: [
        {
          name: 'url',
          description :'URL',
          type: 'text',
          default: 'http://',
        },
      ],
      execute: function() {
        // https://gist.githubusercontent.com/mapsam/eace9bf13d3853bdf273/raw/3cd4b92accd1e04394840ceb93b8d4dd03038611/locations.geojson
        $(dc.form).trigger('form:file', ['load-url']);
      },
      get: function(event, name, parameters) {
        var url = parameters[0];
        dc.util.xhr(url, dc.ops.file[name].callback);
      },
      callback: function(xhr, xhrEvent) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          // get filename based on the end of the url - not sure if this is sustainable
          var name = xhr.responseURL.substring(xhr.responseURL.lastIndexOf('/')+1);
          $(dc.layers).trigger('file:added', [name, data]);
        } else {
          dc.notify('error', xhr.status + ': could not retrieve Gist. Please check your URL');
        }
      }
    },

    'load-gist': {
      description: 'Import files from Gist',
      icon: '<i class="fa fa-github"></i>',
      parameters: [
        {
          name: 'gist',
          description :'Gist ID or URL',
          type: 'text',
        },
      ],
      execute: function() {
        $(dc.form).trigger('form:file', ['load-gist']);
      },
      get: function(event, name, parameters) {
        var gist = parameters[0].split('/')[parameters[0].split('/').length-1];
        var url = 'https://api.github.com/gists/' + gist;
        dc.util.xhr(url, dc.ops.file[name].callback);
      },
      callback: function(xhr, xhrEvent) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          for (var f in data.files) {
            var name = data.files[f].filename;
            $(dc.layers).trigger('file:added', [name, JSON.parse(data.files[f].content)]);
          }
          // dc.notify('success', 'Succesfully retrieved gist')
        } else {
          dc.notify('error', xhr.status + ': could not retrieve Gist. Please check your URL');
        }
      }
    },

    'break1': { type: 'break' },

    'save-geojson': {
      minFeatures: 1,
      description: 'Save as GeoJSON',
      icon: '<i class="fa fa-file-code-o"></i>',
      parameters: [
        {
          name: 'filename',
          description :'Filename prefix to write',
          default: 'dnc'
        }
      ],
      createsLayer: false,
      execute: function() {
        $(dc.selection.list).each(function(i) {
          var content = JSON.stringify(dc.selection.list[i].raw);
          var title = 'dropchop_' + dc.selection.list[i].name + '.geojson';
          saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
          }), title);

        });
      }
    },

    'save-shapefile': {
      minFeatures: 1,
      description: 'Save as Shapefile',
      icon: '<i class="fa fa-file"></i>',
      execute: function() {
        $(dc.selection.list).each(function(i) {
          try {
            var options = {
              folder: 'dropchop_' + dc.selection.list[i].name,
              types: {
                point: 'dropchop_' + dc.selection.list[i].name + '_point',
                polygon: 'dropchop_' + dc.selection.list[i].name + '_poly',
                line: 'dropchop_' + dc.selection.list[i].name + '_line'
              }
            };
            shpwrite.download(dc.selection.list[i].raw, options);
          } catch (err) {
            dc.notify('Error', 'There was a problem downloading the shapefile.' + err);
            throw err;
          }
        });
      },
      createsLayer: false
    },

    'break2': { type: 'break' },

    extent: {
      minFeatures: 1,
      description: 'View extent of layers',
      icon: '<i class="fa fa-globe"></i>',
      execute: function() {
        if(!dc.selection.list.length) {
          // extent of entire layer list if nothing selected
          dc.map.m.fitBounds(dc.map.layergroup.getBounds());  
        } else {
          // otherwise build the bounds based on selected layers
          var bounds;
          $(dc.selection.list).each(function(l) {
            var fl = dc.selection.list[l].featurelayer;
            if(!l) bounds = fl.getBounds();
            else bounds.extend(fl.getBounds());
          });
          dc.map.m.fitBounds(bounds);
        }
        
      }
    },

    'break3': { type: 'break' },

    remove: {
      minFeatures: 1,
      description: 'Remove selected layers',
      icon: '<i class="fa fa-trash-o"></i>',
      execute: function() {
        $(dc.selection.list).each(function(i) {
          $(dc.layers).trigger('layer:removed', [dc.selection.list[i].stamp]);
        });
        dc.selection.clear();
      },
      disableForm: true,
    },

    info: {
      type: 'info',
      description: 'Learn more about dropchop',
      icon: '<i class="fa fa-info"></i>',
      execute: function() {
        window.location = '/about.html';
      }
    }
  };

  return dc;

})(dropchop || {});