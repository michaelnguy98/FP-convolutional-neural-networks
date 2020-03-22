import * as d3 from "d3";
import * as config from "./config";

import puppy from "../Images/dog.png";
import puppySobel from "../Images/puppySobel.png";
import puppySobelConv from "../Images/puppySobelConv.png";
import puppyOutput from "../Images/puppyOutput.png";
    
/**
 * State of the visualization. Number of layers
 */
let numLayers;

const layerText = [
    {
        line1: "Here is the puppy image.",
        line2: "Let's apply a convolution to it!"
    },
    {
        line1: "Certain features of the puppy are being highlighted.",
        line2: "Let's apply another convolution!"
    },
    {
        line1: "The eyes seem to have a lot more prominence with a",
        line2: "little bit of noise around the feet. Let's apply another convolution!"
    },
    {
        line1: "The region most prominent corresponds to the eyes of the puppy.",
        line2: "Our network seems to be searching for these kinds of features..."
    }
];

const animationDuration = 500;

const actions = {
    ADD: 'ADD',
    REMOVE: 'REMOVE'
}

/**
 * Proportions of the SVG
 */
let svgWidth;
let svgHeight;

/**
 * Proportions for image
 */
let imageSectionWidth;
let imageSectionHeight;

let imageSectionX;
let imageSectionY;

let groupWidth;
let groupHeight;

// Image
let imageWidth;
let imageHeight;

let imageX;
let imageY;

// Image Text
let imageTextX;
let imageTextY;

// Arrow
let arrowLength;
let arrowX1;
let arrowX2;
let arrowY;

// Arrowhead
let arrowSize;
let arrowPoints;

let arrowMarkerWidth;
let arrowMarkerHeight;

// Arrow Text
let arrowTextX;
let arrowTextY;

// Start Image
let startImageX;
let startImageY;

let startImageTextX;
let startImageTextY;

/**
 * Proportions of the description text
 */
let textSectionWidth;
let textSectionHeight;

let textSectionX;
let textSectionY;

let textX;
let textY;

/**
 * Proportions of the buttons
 */
let buttonSectionWidth;
let buttonSectionHeight;

let buttonSectionX;
let buttonSectionY;

let buttonWidth;
let buttonHeight;

let nextButtonX;
let nextButtonY;

let nextButtonTextX;
let nextButtonTextY;

let prevButtonX;
let prevButtonY;

let prevButtonTextX;
let prevButtonTextY;

/**
 * Font Size
 */
let fontSize;
let imageTextFontSize;
let arrowFontSize;
let descriptionTextFontSize;
let buttonTextFontSize;

let arrowStrokeWidth;

export function initMultiConvSection() {
    numLayers = 0;

    recalculate();

    initSVG();
}

/**
 * Initialize the SVG.
 */
function initSVG() {
    d3.select("#multiConvSection")
        .append("svg")
        .attr("id", "multiConvSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // arrow
    d3.select("#multiConvSvg").append("svg:defs").append("svg:marker")
        .attr("id", "triangle")
        .attr("refX", 0)
        .attr("refY", arrowSize)
        .attr("markerWidth", arrowMarkerWidth)
        .attr("markerHeight", arrowMarkerHeight)
        .attr("orient", "auto")
        .append("path")
        .attr("d", d3.line()(arrowPoints))
        .style("stroke", "black");
    
    initInputImage();
    initConvLayers();
    initText();
    initButtons();
}

/**
 * Draws the image and text
 */
function initInputImage() {
    const leftPadding = (svgWidth - imageWidth - (groupWidth * numLayers)) / 2;

    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "imageWrapper")
        .attr("transform", `translate(${leftPadding}, ${startImageY})`);
    imageWrapper.append("svg:image")
        .attr("id", "image0")
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr('xlink:href', puppy)
        .attr("stroke", "black");
    imageWrapper.append("text")
        .attr("x", startImageTextX - startImageX)
        .attr("y", startImageTextY - startImageY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", imageTextFontSize)
        .attr("pointer-events", "none")
        .text("Input");
}

/**
 * Draws the ConvLayers
 */
function initConvLayers() {
    const convLayerWrappers = d3.select("#multiConvSvg")
        .selectAll(".convLayerWrapper")
        .data(Array(3))
        .enter()
        .append("g")
        .attr("transform", (_, i) => `translate(${imageWidth + startImageX + (groupWidth * i)}, ${imageSectionY + (0.3 * imageSectionHeight)})`)
        .attr("opacity", 0.0)
        .classed("convLayerWrapper", true);

    //line              
    convLayerWrappers.append("line")
        .attr("x1", arrowX1)
        .attr("y1", arrowY)
        .attr("x2", arrowX2)
        .attr("y2", arrowY)          
        .attr("stroke-width", arrowStrokeWidth)
        .attr("stroke", "black")
        .attr("marker-end", "url(#triangle)");

    //text
    convLayerWrappers.append("text")
        .attr("x", arrowTextX)
        .attr("y", arrowTextY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", arrowFontSize)
        .attr("pointer-events", "none")
        .text("Convolution")
        .classed("arrowCaption", true);

    //image
    convLayerWrappers.append("svg:image")
        .attr("id", (_,i) => "image" + (i + 1))
        .attr("x", imageX)
        .attr("y", imageY)
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
        })
        .classed("image", true);

    //text
    convLayerWrappers.append("text")
        .attr("x", imageTextX)
        .attr("y", imageTextY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", imageTextFontSize)
        .attr("pointer-events", "none")
        .text((_, i) => `Layer ${i+1}`)
        .classed("imageCaption", true);
}

function initButtons() {
    // This is the Add Layer Button
    const addButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "addButtonWrapper");
    addButtonWrapper.append("rect")
        .attr("x", nextButtonX)
        .attr("y", nextButtonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.nextColor)
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.ADD));
    addButtonWrapper.append("text")
        .attr("x", nextButtonTextX)
        .attr("y", nextButtonTextY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", buttonTextFontSize)
        .attr("pointer-events", "none")
        .text("Next");

    // This is the Remove Layer Button
    const removeButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "removeButtonWrapper")
        .attr("visibility", "hidden");
    removeButtonWrapper.append("rect")
        .attr("x", prevButtonX)
        .attr("y", prevButtonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.prevColor)
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.REMOVE));
    removeButtonWrapper.append("text")
        .attr("x", prevButtonTextX)
        .attr("y", prevButtonTextY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", buttonTextFontSize)
        .attr("pointer-events", "none")
        .text("Prev");
}

/**
 * Draws the desciption text
 */
function initText() {
    const textWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "textWrapper");
    textWrapper.append("text")
        .attr("x", textX)
        .attr("y", textY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", descriptionTextFontSize)
        .attr("pointer-events", "none")
        .attr("dy", "0em")
        .text(layerText[numLayers].line1)
        .classed("descriptionText", true);
    textWrapper.append("text")
        .attr("x", textX)
        .attr("y", textY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", descriptionTextFontSize)
        .attr("pointer-events", "none")
        .attr("dy", "1em")
        .text(layerText[numLayers].line2)
        .classed("descriptionText2", true);
}

/**
 * Updates the states of the layers
 */
function updateState(action) {
    const t = d3.transition().duration(animationDuration).ease(d3.easeCubic);

    const root = d3.select("#multiConvSvg");

    switch (action) {
        case 'ADD':
            if (numLayers <= 2) {
                numLayers++;
            }
            if (numLayers > 0) {
                root.select("#removeButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers >= 3) {
                root.select("#addButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        case 'REMOVE':
            if (numLayers > 0) {
                numLayers--;
            }
            if (numLayers < 3) {
                root.select("#addButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers <= 0) {
                root.select("#removeButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
    }

    const leftPadding = (svgWidth - imageWidth - (groupWidth * numLayers)) / 2;

    root.select("#imageWrapper")
        .transition(t)
        .attr("transform", `translate(${leftPadding}, ${startImageY})`);
    root.selectAll(".convLayerWrapper")
        .transition(t)
        .attr("transform", (_, i) => `translate(${leftPadding + imageWidth + (groupWidth * i)}, ${imageSectionY + (0.3 * imageSectionHeight)})`)
        .style("opacity", (_,i) => {
            if (i >= numLayers) {
                return 0.0;
            } else {
                return 1.0;
            };
        });

    const text = layerText[numLayers];
    d3.select("#textWrapper")
        .select(".descriptionText")
        .text(text.line1);
    d3.select("#textWrapper")
        .select(".descriptionText2")
        .text(text.line2);
}

function recalculate() {
    svgWidth = config.svgWidth;
    svgHeight = svgWidth / 4;

    imageSectionWidth = svgWidth;
    imageSectionHeight = svgHeight / 2;

    imageSectionX = 0;
    imageSectionY = 0;

    groupWidth = 0.2 * imageSectionWidth;
    groupHeight = 0.5 * imageSectionHeight;

    imageWidth = 0.4 * groupWidth;
    imageHeight = imageWidth;

    imageX = 0.6 * groupWidth;
    imageY = 0.2 * groupHeight;

    imageTextX = imageX + imageWidth / 2;
    imageTextY = imageY - 0.1 * imageHeight;

    arrowLength = 0.35 * groupWidth;
    arrowX1 = 0.1 * groupWidth;
    arrowX2 = arrowX1 + arrowLength;
    arrowY = 0.7 * groupHeight;

    arrowSize = 0.04 * groupHeight;
    arrowPoints = [[0, 0], [0, arrowSize * 2], [arrowSize * 3, arrowSize]];

    arrowMarkerWidth = groupHeight / 5;
    arrowMarkerHeight = groupHeight / 5;

    arrowTextX = arrowX1 + arrowLength / 2;
    arrowTextY = arrowY - 0.1 * groupHeight;

    startImageX = 0.15 * imageSectionWidth;
    startImageY = imageSectionY + (0.3 * imageSectionHeight) + imageY;

    startImageTextX = startImageX + imageWidth / 2;
    startImageTextY = startImageY - 0.1 * imageHeight;

    textSectionWidth = svgWidth;
    textSectionHeight = svgHeight / 3.5;

    textSectionX = 0;
    textSectionY = svgHeight / 2;

    textX = textSectionX + textSectionWidth / 2;
    textY = textSectionY + textSectionHeight / 2;

    buttonSectionWidth = svgWidth;
    buttonSectionHeight = textSectionHeight;

    buttonSectionX = 0;
    buttonSectionY = (3 / 4) * svgHeight;

    buttonWidth = buttonSectionWidth / 15;
    buttonHeight = buttonSectionHeight / 2;

    nextButtonX = buttonSectionX + buttonSectionWidth / 2;
    nextButtonY = buttonSectionY + buttonSectionHeight / 4;

    nextButtonTextX = nextButtonX + buttonWidth / 2;
    nextButtonTextY = nextButtonY + buttonHeight / 2;

    prevButtonX = nextButtonX - buttonWidth;
    prevButtonY = nextButtonY;

    prevButtonTextX = prevButtonX + buttonWidth / 2;
    prevButtonTextY = prevButtonY + buttonHeight / 2;

    fontSize = svgWidth / 40;
    imageTextFontSize = fontSize / 3;
    arrowFontSize = imageTextFontSize;
    descriptionTextFontSize = fontSize / 2;
    buttonTextFontSize = fontSize / 2;

    arrowStrokeWidth = fontSize / 30;
}

export function resizeMultiConv() {
    recalculate();

    // SVG
    const root = d3.select("#multiConvSection")
        .select("#multiConvSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    root.select("#triangle")
        .attr("refX", 0)
        .attr("refY", arrowSize)
        .attr("markerWidth", arrowMarkerWidth)
        .attr("markerHeight", arrowMarkerHeight)
        .attr("orient", "auto")
        .attr("d", d3.line()(arrowPoints))
    
    const leftPadding = (svgWidth - imageWidth - (groupWidth * numLayers)) / 2;

    root.select("#imageWrapper")
        .attr("transform", `translate(${leftPadding}, ${startImageY})`);
    
    // Visualization section
    const convLayerWrappers = root.selectAll(".convLayerWrapper")
        .attr("transform", (_, i) => `translate(${leftPadding + imageWidth + (groupWidth * i)}, ${imageSectionY + (0.3 * imageSectionHeight)})`)
              
    convLayerWrappers.selectAll("line")
        .attr("x1", arrowX1)
        .attr("y1", arrowY)
        .attr("x2", arrowX2)
        .attr("y2", arrowY)          
        .attr("stroke-width", arrowStrokeWidth)
        .attr("marker-end", "url(#triangle)");

    convLayerWrappers.selectAll(".arrowCaption")
        .attr("x", arrowTextX)
        .attr("y", arrowTextY)
        .attr("font-size", arrowFontSize);

    convLayerWrappers.selectAll(".image")
        .attr("x", imageX)
        .attr("y", imageY)
        .attr("width", imageWidth)
        .attr("height", imageHeight);

    convLayerWrappers.selectAll(".imageCaption")
        .attr("x", imageTextX)
        .attr("y", imageTextY)
        .attr("font-size", imageTextFontSize);
    
    // Buttons
    // This is the Add Layer Button
    const addButtonWrapper = root.select("#addButtonWrapper");
    addButtonWrapper.select("rect")
        .attr("x", nextButtonX)
        .attr("y", nextButtonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight);
    addButtonWrapper.select("text")
        .attr("x", nextButtonTextX)
        .attr("y", nextButtonTextY)
        .attr("font-size", buttonTextFontSize);

    // This is the Remove Layer Button
    const removeButtonWrapper = root.select("#removeButtonWrapper");
    removeButtonWrapper.select("rect")
        .attr("x", prevButtonX)
        .attr("y", prevButtonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight);
    removeButtonWrapper.select("text")
        .attr("x", prevButtonTextX)
        .attr("y", prevButtonTextY)
        .attr("font-size", buttonTextFontSize);

    
    // Input Image
    const imageWrapper = root.select("#imageWrapper");
    imageWrapper.select("#image0")
        .attr("width", imageWidth)
        .attr("height", imageHeight);
    imageWrapper.select("text")
        .attr("x", startImageTextX - startImageX)
        .attr("y", startImageTextY - startImageY)
        .attr("font-size", imageTextFontSize);


    // Description text
    const textWrapper = root.select("#textWrapper");
    textWrapper.select(".descriptionText")
        .attr("x", textX)
        .attr("y", textY)
        .attr("font-size", descriptionTextFontSize);
    textWrapper.select(".descriptionText2")
        .attr("x", textX)
        .attr("y", textY)
        .attr("font-size", descriptionTextFontSize);
}