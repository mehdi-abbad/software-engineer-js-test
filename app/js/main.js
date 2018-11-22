const _ = require('underscore');
const mitt = require('mitt');

const Canvas = require('./canvas');
const Loader = require('./loader');

const ApplicationTemplate = _.template(`
    <h1>Test application</h1>
    <div id="fileLoader"></div>
    <div id="canvasContainer" class="column left"></div>
    <div class="column right">
        <div id="debugContainer">
            <!-- will hold debug messages -->
        </div>
    </div>
    <div id="actions">
        <button id="generateBtn" disabled>Generate</button>
        <button id="importBtn" disabled>Import</button>
    </div>
`);

class Application {
    constructor() {
        this.targetElement = null;
        this.debugContainer = null;
        this.canvasContainer = null;
        this.emitter = mitt();
        this.loader = new Loader(this.emitter);
        this.canvas = null;

    }

    onFileSelected(fileUri) {
        if (!this.canvas) {
            this.canvas = new Canvas(this.emitter);
            this.canvas.renderTo(this.$('#canvasContainer'));
        }
        this.canvas.loadImage(fileUri);
        this.canvas.loaderDescription = {
            id:fileUri.substring(50,58), // let's pretend this is random and unique :p
            uri:fileUri
        };
    }

    generateDescription() {
        this.log("====== Generated description ===========");
        this.log("----------------------------------><8-");
        this.log(JSON.stringify({
            canvas: this.canvas.generateDescription(),
            loader: {
                uri: this.canvas.loaderDescription.uri.substr(0,30)+'...',
                id : this.canvas.loaderDescription.id
            }
        }));
        this.log("-8><----------------------------------");
    }

    importDescription() {
        let jsonDescription = prompt('Past description here','JSON Description');
        if (!jsonDescription) return;
        try {
            let desc = JSON.parse(jsonDescription);
            if (desc.loader.id!==this.canvas.loaderDescription.id) {
                this.log('Seems this description is entended for another image');   
            } else {
                this.canvas.loadDescription(desc.canvas);
                this.log('Description loaded');
            }
        } catch (e){
            this.log('Error importing description');
            this.log(e);
        }
    }

    $(selector) {return this.targetElement.querySelector(selector);}

    onCanvasLoadStatus(status) {
        this.$('#generateBtn').disabled = !status;
        this.$('#importBtn').disabled = !status;
    }

    renderTo(element) {
        this.targetElement = element;
        element.innerHTML = ApplicationTemplate();
        this.debugContainer = element.querySelector('#debugContainer');
        this.loader.renderTo(element.querySelector('#fileLoader'));
        this.bindEvents();
    }

    bindEvents() {
        this.emitter.on('loader:file', ({fileUri}) => this.onFileSelected(fileUri));
        this.emitter.on('canvas:loaded', (status) => this.onCanvasLoadStatus(status));
        this.$('#generateBtn').addEventListener('click', e=> this.generateDescription());

        this.$('#importBtn').addEventListener('click', e=> this.importDescription());
    }

    log(msg) {
        let p = document.createElement('P');
        p.innerText = msg;
        this.debugContainer.appendChild(p);
    }
}

const App = new Application();

App.renderTo(document.body);
App.log('Application is ready');