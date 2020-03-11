import * as d3 from "d3";
import * as config from './config';
import birdRed from '../Images/birdRed.png';
import birdGreen from '../Images/birdGreen.png';
import birdBlue from '../Images/birdBlue.png';

export function initAnimateRGBSection() {
    initSVG();
    updateFrame(false)
}

// Initial state of image
let unified = false;

// Transition duration
const separateDuration = 2000;

// Margin between images(also padding on side and top and separating the button)
const margin = config.kernelCellWidth;

// Image height and width
const imgWidth = 5 * config.kernelCellWidth;
const imgHeight = 5 * config.kernelCellHeight;

// button height and width
const buttonWidth = config.cellWidth * 5;
const buttonHeight = config.cellHeight * 2;

// SVG height and width
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
    
    // Background(black for the images to blend with)
    root.append("rect")
        .attr("id", "backR")
        .attr("x", margin * 2 + imgWidth)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
    root.append("rect")
        .attr("id", "backG")
        .attr("x", margin * 2 + imgWidth)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
    root.append("rect")
        .attr("id", "backB")
        .attr("x", margin * 2 + imgWidth)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)

    // RGB channel images
    root.append("svg:image")
        .attr("id", "imgR")
        .attr("x", margin * 2 + imgWidth)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
        .attr("image-rendering", "pixelated")
        .attr("xlink:href", birdRed)
        .style("mix-blend-mode", "screen");
    root.append("svg:image")
        .attr("id", "imgG")
        .attr("x", margin * 2 + imgWidth)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
        .attr("image-rendering", "pixelated")
        .attr("xlink:href", birdGreen)
        .style("mix-blend-mode", "screen");
    root.append("svg:image")
        .attr("id", "imgB")
        .attr("x", margin * 2 + imgWidth)
        .attr("y", margin)
        .attr("width", imgWidth)
        .attr("height", imgHeight)
        .attr("image-rendering", "pixelated")
        .attr("xlink:href", birdBlue)
        .style("mix-blend-mode", "screen");

    // Button Wrapper
    const buttonWrapper = root.append("g")
        .attr("id", "buttonWrapper")
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

/**
 * Separate/join channels(with transition)
 */
function updateFrame(useTransition = true) {
    disableButton();

    const animation = useTransition ?
        d3.transition().duration(separateDuration).ease(d3.easeCubic) :
        d3.transition().duration(0);

    if (unified) {
        d3.select("#animateRGBSvg")
            .select("#buttonText")
            .text("Fragment");

        d3.select("#backR")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin)
            .on("end", enableButton);
        d3.select("#backG")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);
        d3.select("#backB")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);

        d3.select("#imgR")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);
        d3.select("#imgG")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);
        d3.select("#imgB")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);

        unified = false;
    } else {
        d3.select("#animateRGBSvg")
            .select("#buttonText")
            .text("Unify");

        d3.select("#backR")
            .transition(animation)
            .attr("x", margin)
            .attr("y", margin)
            .on("end", enableButton);
        d3.select("#backG")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);
        d3.select("#backB")
            .transition(animation)
            .attr("x", margin * 3 + imgWidth * 2)
            .attr("y", margin);

        d3.select("#imgR")
            .transition(animation)
            .attr("x", margin)
            .attr("y", margin);
        d3.select("#imgG")
            .transition(animation)
            .attr("x", margin * 2 + imgWidth)
            .attr("y", margin);
        d3.select("#imgB")
            .transition(animation)
            .attr("x", margin * 3 + imgWidth * 2)
            .attr("y", margin);

        unified = true;
    }
}

function disableButton() {
    d3.select("#animateRGBSvg")
        .select("#buttonWrapper")
        .style("cursor", "default")
        .on("click", () => {});
}
function enableButton() {
    d3.select("#animateRGBSvg")
        .select("#buttonWrapper")
        .style("cursor", "pointer")
        .on("click", updateFrame);
}
