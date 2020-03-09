import * as d3 from "d3";
import * as config from './config';
import birdRed from '../Images/birdRed.png';
import birdGreen from '../Images/birdGreen.png';
import birdBlue from '../Images/birdBlue.png';

export function initAnimateRGBSection() {
    initSVG();
}

let unified = true;

const separateDuration = 3000;

const margin = config.kernelCellWidth;

const imgWidth = 5 * config.kernelCellWidth;
const imgHeight = 5 * config.kernelCellHeight;

const buttonWidth = config.cellWidth * 5;
const buttonHeight = config.cellHeight * 2;

const svgWidth = imgWidth * 3 + margin * 4;
const svgHeight = imgHeight + margin * 3 + buttonHeight;

/**
 * Initialize the SVG.
 */
function initSVG() {
    const root = d3.select("#animateRGBSection")
        .append("svg")
        .attr("id", "animateRGBSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    const defs = root.append("defs");

    const composite = defs.append("filter")
        .attr("id", "imageComposite");

    composite.append("feImage")
        .attr("id", "imgR")
        .attr("result", "red")
        .attr("x", margin * 2 + imgWidth * 1)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
        .attr("xlink:href", birdRed);
    composite.append("feImage")
        .attr("id", "imgG")
        .attr("result", "green")
        .attr("x", margin * 2 + imgWidth * 1)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
        .attr("xlink:href", birdGreen);
    composite.append("feImage")
        .attr("id", "imgB")
        .attr("result", "blue")
        .attr("x", margin * 2 + imgWidth * 1)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
        .attr("xlink:href", birdBlue);

    composite.append("feBlend")
        .attr("in", "red")
        .attr("in2", "green")
        .attr("result", "RG")
        .attr("mode", "screen");
    composite.append("feBlend")
        .attr("in", "RG")
        .attr("in2", "blue")
        .attr("mode", "screen");
    
    root.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("filter", "url(#imageComposite)");

    // Button Wrapper
    const buttonWrapper = root.append("g")
        .attr("id", "prevButtonWrapper")
        .attr("transform", `translate(${(svgWidth - buttonWidth) / 2}, ${margin * 2 + imgHeight})`)
        .style("cursor", "pointer")
        .on("click", updateFrame);

    // Button Color
    buttonWrapper.append("rect")
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.nextColor)
        .attr("id", "buttonColor");

    // Button Text
    buttonWrapper.append("text")
        .attr("id", "buttonText")
        .attr("x", buttonWidth / 2)
        .attr("y", buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", config.fontSize)
        .text("Next");
}

function updateFrame() {
    const animation = d3.transition().duration(separateDuration).ease(d3.easeCubic);

    if (unified) {
        d3.select("#imgR")
            .transition(animation)
            .attr("x", margin)
            .attr("y", margin);
        d3.select("#imgG")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth * 1)
            .attr("y", margin);
        d3.select("#imgB")
            .transition(animation)
            .attr("x", margin * 3 + imgWidth * 2)
            .attr("y", margin);

        unified = false;
    } else {
        d3.select("#imgR")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth * 1)
            .attr("y", margin)
        d3.select("#imgG")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth * 1)
            .attr("y", margin)
        d3.select("#imgB")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth * 1)
            .attr("y", margin)

        unified = true;
    }
}
