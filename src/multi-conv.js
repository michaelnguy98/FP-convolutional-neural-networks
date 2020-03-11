import * as d3 from "d3";
import image1 from "../cat_conv/cat_conv1.png";
import image2 from "../cat_conv/cat_conv3.png";
import image3 from "../cat_conv/cat_conv5.png";

import puppy from "../Images/dog.png";
import puppySobel from "../Images/puppySobel.png";
import puppySobelConv from "../Images/puppySobelConv.png";
import puppyOutput from "../Images/puppyOutput.png";

/**
 * State of the visualization. Number of layers
 */
let numLayers = 0;

/**
 * Proportions of the SVG
 */
let svgWidth = 900;
let svgHeight = svgWidth / 3;

/**
 * Proportions of the description text
 */
let textSectionWidth = svgWidth;
let textSectionHeight = svgHeight / 4;

let textSectionX = 0;
let textSectionY = svgHeight / 2;

let textX = textSectionWidth / 2;
let textY = textSectionY + textSectionHeight / 2;

/**
 * Proportions of the buttons
 */
let buttonSectionWidth = svgWidth;
let buttonSectionHeight = textSectionHeight;



const fontSize = 30;

const rectWidth = 50;
const rectHeight = 140;

const startingConvX = 50;
const startingConvY = 50;

const spacing = 220;
const lineLength = 75;
const imageWidth = 100;
const imageHeight = 100;

const widthPadding = startingConvX;

const borderWidth = widthPadding + 805 + widthPadding;
const borderHeight = 900;

export function initMultiConvSection() {
    initSVG();
    drawInputImage();
    drawConvLayers();
    drawButtons();
    drawText();
}

/**
 * Initialize the SVG.
 */
export function initSVG() {
    d3.select("#multiConvSection")
        .append("svg")
        .attr("id", "multiConvSvg")
        .attr("width", borderWidth)
        .attr("height", borderHeight);
    
    // arrow
    d3.select("#multiConvSvg").append("svg:defs").append("svg:marker")
        .attr("id", "triangle")
        .attr("refX", 0)
        .attr("refY", 3)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,0 L0,6 L9,3 z")
        .style("stroke", "black");
}

/**
 * Draws the ConvLayers
 */
export function drawConvLayers() {
    // Make Layers

    const data = [];

    for (let i = 0; i < numLayers; i++) {
        data.push(`Layer ${i + 1}`);
    }
    
    const convLayerWrappers = d3.select("#multiConvSvg")
        .selectAll(".convLayerWrapper")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", (_, i) => `translate(${180 + (225 * i)}, ${startingConvY - 20})`)
        .attr("opacity", 0.5)
        .classed("convLayerWrapper", true);

    const startLayers = startingConvX + 120
    
    //line              
    convLayerWrappers.append("line")
        .attr("x1", 0)
        .attr("y1", 70)
        .attr("x2", lineLength)
        .attr("y2", 70)          
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("marker-end", "url(#triangle)")
        .classed("layerArrow", true);

    //text
    convLayerWrappers.append("text")
        .attr("x", 40)
        .attr("y", 55)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Convolution");

    //image
    convLayerWrappers.append("svg:image")
        .attr("x", 105)
        .attr("y", 20)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr("stroke", "black")
        .attr("image-rendering", "pixelated")
        .attr('xlink:href', (_, i) => {
            let img;
            if (i+1 == 1) {
                img = puppySobel;
            } else if (i+1 == 2) {
                img = puppySobelConv;
            } else if (i+1 == 3) {
                img = puppyOutput;
            }
            return img;
        });

    const imageY = startingConvY;

    convLayerWrappers.append("text")
        .attr("x", 155)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text((_, i) => `Layer ${i+1}`);

    d3.select("#multiConvSvg")
        .selectAll(".convLayerText")
        .data(data)
        .text((d) => d);

    d3.select("#multiConvSvg")
        .selectAll(".convLayerWrapper")
        .data(data)
        .exit()
        .remove();
}

export function drawButtons() {
    // Make Button
    const buttonWidth = 3 * rectWidth;
    const buttonHeight = 50;

    const buttonX = startingConvX + (spacing * (3 - 1) + rectWidth) / 2 - buttonWidth / 2;
    const buttonY = startingConvY + rectHeight + 75;
    
    // This is the Add Layer Button
    const addButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "addButtonWrapper");
    addButtonWrapper.append("rect")
        .attr("x", buttonX)
        .attr("y", buttonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", "white")
        .attr("stroke", "black")
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.ADD))
        .classed("buttonRect", true);
    addButtonWrapper.append("text")
        .attr("x", buttonX + buttonWidth / 2)
        .attr("y", buttonY + buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Add Layer")
        .classed("buttonText", true);

    let buttonSpacing = 200;

    // This is the Remove Layer Button
    const removeButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "removeButtonWrapper")
        .attr("visibility", "hidden");
    removeButtonWrapper.append("rect")
        .attr("x", buttonX + buttonSpacing)
        .attr("y", buttonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", "white")
        .attr("stroke", "black")
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.REMOVE))
        .classed("buttonRect", true);
    removeButtonWrapper.append("text")
        .attr("x", buttonX + buttonSpacing + buttonWidth / 2)
        .attr("y", buttonY + buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Remove Layer")
        .classed("buttonText", true);
}

/**
 * Draws the image and text
 */
export function drawInputImage() {
    
    let imageX = startingConvX;
    let imageY = startingConvY;
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "imageWrapper");
    imageWrapper.append("svg:image")
        .attr("x", imageX)
        .attr("y", imageY)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr('xlink:href', puppy)
        .attr("stroke", "black");
    imageWrapper.append("text")
        .attr("x", imageX + imageWidth / 2)
        .attr("y", imageY - imageHeight / 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Input");
    
}

/**
 * Draws the text
 */
export function drawText() {
    const imageWidth = 100;
    const imageHeight = 100; 
    
    let imageX = startingConvX + 75;
    let imageY = startingConvY + 100;
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "textWrapper");
    imageWrapper.append("text")
        .attr("x", imageX + spacing + imageWidth / 2)
        .attr("y", imageY + imageHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .attr("dy", "0em")
        .text("Here is the puppy image.")
        .classed("descriptionText", true);
    imageWrapper.append("text")
        .attr("x", imageX + spacing + imageWidth / 2)
        .attr("y", imageY + imageHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .attr("dy", "1em")
        .text("Lets apply a convolution to it!")
        .classed("descriptionText2", true);;
}

const actions = {
    ADD: 'ADD',
    REMOVE: 'REMOVE'
}

/**
 * Updates the states of the layers
 */
export function updateState(action) {
    switch (action) {
        case 'ADD':
            if (numLayers <= 2) {
                numLayers++;
            }
            if (numLayers > 0) {
                d3.select("#removeButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers >= 3) {
                d3.select("#addButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        case 'REMOVE':
            if (numLayers > 0) {
                numLayers--;
            }
            if (numLayers < 3) {
                d3.select("#addButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers <= 0) {
                d3.select("#removeButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        default:

    }

    let txt;
    let txt2;
    if (numLayers == 1) {
        txt = "Certain features of the puppy are being highlighted.";
        txt2 = "Let's apply another convolution!";
    } else if (numLayers == 2) {
        txt = "The eyes seem to have a lot more prominence with a";
        txt2 = "little bit of noise around the feet. Let's apply another convolution!";
    } else if (numLayers == 3) {
        txt = "The region most prominent corresponds to the eyes of the puppy.";
        txt2 = "Our network seems to be searching for these kinds of features...";
    } else {
        txt = "Here is the puppy image.";
        txt2 = "Let's apply a convolution to it!";
    }
    d3.select("#textWrapper")
        .select(".descriptionText")
        .text(txt);
    d3.select("#textWrapper")
        .select(".descriptionText2")
        .text(txt2);

    drawConvLayers();
}