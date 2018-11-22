/**
    The canvas component is has the "core" responsability of panning and rescaling
    the image.
*/

const _ = require('underscore');

const CanvasTemplate = _.template(`
    <div class="canvasContainer">
        <div class="imageContainer">
            <img class="image">
            <div class="frame"></div>
        </div>
        <div class="canvasControls">
            <button class="move" data-type="left">←</button>
            <button class="move" data-type="right">→</button>
            <button class="move" data-type="top">↑</button>
            <button class="move" data-type="bottom">↓</button>
            <input type="range" name="scale" min="0" max="100" value="0">
        </div>
    </div>
`,{variable: 'data'});

module.exports = class Canvas {
    
    constructor(emitter, width=15, height=10) {
        this.emitter = emitter;

        this.width = width;
        this.height = height;
        
        this.ratio = width / height;
        
        this.scale = 0;
        this.srcWidth = 0;
        this.srcHeight = 0;
        this.offset = [0, 0]; // << [x,y]
        
        this.targetElement = null;
        this.minScale = 1;

        this.loaded = false;
    }

    generateDescription() {
        let {width, height, scale, offset, srcHeight, srcWidth} = this;
        return {
            width,
            height,
            srcHeight,
            srcWidth,
            scale,
            offset
        }
    }

    loadDescription({width, height, srcHeight, srcWidth, scale, offset}) {
        this.width = width;
        this.height = height;
        this.ratio = width / height;

        this.scale = scale;
        this.srcWidth = srcWidth;
        this.srcHeight = srcHeight;
        this.offset = offset;

        this.transformImage();
    }

    //be DRY
    emit(name, event) {this.emitter && this.emitter.emit(name, event);}
    $(selector) {return this.targetElement.querySelector(selector);}
    getImage() {return this.$('img');}
    getImageContainer() {return this.$('.imageContainer');}

    init(description) {
        this.scale = 0;
        this.srcWidth = 0;
        this.srcHeight = 0;
        this.offset = [0, 0]; // << [x,y]
    }

    loadImage(imageUri, description) {
        let img = this.getImage();
        if (description) {
            this.loadDescription(description);
        } else {
            this.init();
        }
        this.loaded = false;
        img.src = imageUri;
        this.emit('canvas:loaded', false);
    }

    afterLoad() {
        this.fitGeometry();
        this.transformImage();
        this.loaded = true;
        this.emit('canvas:loaded', true);
    }

    getCanvasPixelSize() {
        let imgContainer = this.$('.imageContainer');
        return {
            w: imgContainer.clientWidth,
            h: imgContainer.clientHeight
        };
    }

    setupCanvasSurface() {
        // since the width is always fixed, we set the height using the ratio
        let imgContainer = this.getImageContainer();
        imgContainer.style.height = (imgContainer.clientWidth / this.ratio) + 'px';
    }

    /* Decides the base scale needed so the image always fills the canvas */
    fitGeometry() {
        let imgRatio = this.srcWidth / this.srcHeight;
        let cps = this.getCanvasPixelSize();

        if (imgRatio > this.ratio) {
            this.minScale = cps.h / this.srcHeight;
        } else {
            this.minScale = cps.w / this.srcWidth;
        }
        this.scale=this.minScale;
    }

    transformImage() {
        let img = this.getImage();

        img.style.width = (this.srcWidth * this.scale ) + 'px';
        img.style.height = (this.srcHeight * this.scale )  + 'px';

        img.style.left = this.offset[0] + 'px';
        img.style.top = this.offset[1] + 'px';
    }

    setOffset(x, y, diff) {
        
        let cps = this.getCanvasPixelSize();

        if (diff) {
            x = this.offset[0]+x;
            y = this.offset[1]+y;
        }

        if (x>0) x=0; else x = Math.max(x, cps.w - this.srcWidth*this.scale);
        if (y>0) y=0; else y = Math.max(y, cps.h - this.srcHeight*this.scale);

        this.offset = [x,y];
        this.transformImage();
    }

    setScale(scale) {
        let oldScale = this.scale;
        let cps = this.getCanvasPixelSize();
        this.scale = this.minScale + scale/100;
        
        let scaleDiff = this.scale/oldScale;
        let tx = scaleDiff * (this.offset[0] - cps.w*0.5 ) + cps.w*0.5;
        let ty = scaleDiff * (this.offset[1] - cps.h*0.5 ) + cps.h*0.5;

        // setOffset() will call transformImage() for us
        this.setOffset(tx, ty);
    }

    renderTo(element) {
        this.targetElement = element;
        this.targetElement.innerHTML = CanvasTemplate();
        this.setupCanvasSurface();
        this.bindEvents();
    }

    bindEvents() {
        let img = this.getImage();
        img.onload = _=> {
            this.srcWidth = img.naturalWidth;
            this.srcHeight = img.naturalHeight;
            this.loaded = true;
            this.afterLoad();
        };
        this.$(".canvasControls")
            .addEventListener('click', e => {
                if (!e.target.classList.contains('move')) return;
                let trans; 
                switch (e.target.getAttribute('data-type')) {
                    case 'left': trans = [-1,0]; break;
                    case 'right': trans = [+1,0]; break;
                    case 'top': trans = [0,-1]; break;
                    case 'bottom': trans = [0,+1]; break;
                }

                this.setOffset(trans[0]*10,trans[1]*10, true);
            });
        this.$(".canvasControls input[name=scale]")
            .addEventListener('change', e => {
                this.setScale(+e.target.value);
            });
        /*
        Support panning using mouse events
        this.$(".canvasImage").addEventListener('mousemove', )
        this.$(".canvasImage").addEventListener('mousemove', )
        this.$(".canvasImage").addEventListener('mouseup', )
        */
    }
};