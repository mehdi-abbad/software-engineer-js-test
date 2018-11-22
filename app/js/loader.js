/**
    The loader has the task of loading the file. This is shields the Canvas
    componenet from the loading "magic" and implementation details.

    Current strategy is to load the file from the disk and use a data uri, but
    we can easily swap the implementation to a more oldschool strategy like
    PUT'ing the file to the server first then get the uri.
*/

const mitt = require('mitt');
const _ = require('underscore');

const SUPPORTED_FORMATS = {
    'image/jpeg':1,
    'image/png':1,
    'image/gif':1
};

const LoaderTemplate = _.template(`
    <form action="#">
        <fieldset>
            <label>
                <input type="file"/> Select an Image file
            </label>
        </fieldset>
    </form>
`);


module.exports = class Loader {
    constructor(emitter) {
        this.emitter = emitter;
        this.containerElement = null;
    }

    onFiles(event) {
        let files = event.target.files;
        if (!files) return;
        // This will give the first supported file
        let file = Array.prototype.find.call(files, f => SUPPORTED_FORMATS[f.type] );
        if (!file) return;
        let reader = new FileReader();
        reader.onload = e => this.emitter.emit('loader:file', { fileUri: reader.result });
        reader.readAsDataURL( file );
    }

    renderTo(element) {
        this.containerElement = element;
        this.containerElement.innerHTML = LoaderTemplate();
        this.bindEvents();
    }

    bindEvents() {
        this.containerElement.querySelector('input[type="file"]')
            .onchange = e => this.onFiles(e);            
    }

};