import * as d3 from "d3";
import * as config from './config';
import { max } from 'd3';

export function initAnimateMathSection() {
    initSVG();
    drawFrame(false);
}

let curFrame = 0;
const frames = [
    {
        'matrices': [
            [['1', '2', '4'],
             ['2', '4', '4'],
             ['2', '0', '0']],
            [['0', '1', '0'],
             ['1', '2', '1'],
             ['0', '1', '0']]
        ],
        'separator': '×'
    },
    {
        'matrices': [
            [['1×0', '2×1', '4×0'],
             ['2×1', '4×2', '4×1'],
             ['2×0', '0×1', '0×0']]
        ],
        'separator': null
    },
    {
        'matrices': [
            [['0', '2', '0'],
             ['2', '8', '4'],
             ['0', '0', '0']],
        ],
        'separator': null
    },
    {
        'matrices': [
            [['0']],
            [['2']],
            [['0']],
            [['2']],
            [['8']],
            [['4']],
            [['0']],
            [['0']],
            [['0']]
        ],
        'separator': '+'
    },
    {
        'matrices': [
            [['16']],
        ],
        'separator': null
    }
];

const gapSize = 1;

let maxNumCells = 0;
let maxNumRows = 0;
let maxNumCols = 0;
for (const frame of frames) {
    if (frame.matrices[0].length > maxNumRows) {
        maxNumRows = frame.matrices[0].length;
    }
    if ((frame.matrices[0][0].length) * frame.matrices.length + gapSize * (frame.matrices.length - 1) > maxNumCols) {
        maxNumCols = (frame.matrices[0][0].length) * frame.matrices.length + gapSize * (frame.matrices.length - 1);
    }
    if (frame.matrices.length * frame.matrices[0].length * frame.matrices[0][0].length > maxNumCells) {
        maxNumCells = frame.matrices.length * frame.matrices[0].length * frame.matrices[0][0].length;
    }
}

function flattenArray(a) {
    return a.flat().flat();
}

for (const frame of frames) {
    const flat = flattenArray(frame.matrices);
    const paddedCells = Array(maxNumCells - flat.length).fill('').concat(flat);
    frame.paddedCells = paddedCells;
}

const moveAnimationDuration = 3000;
const textAnimationDuration = 1500;

const cellWidth = config.kernelCellWidth;
const cellHeight = config.kernelCellHeight;
const fontSize = config.fontSize * 1.5;
    
const buttonWidth = config.cellWidth * 5;
const buttonHeight = config.cellHeight * 2;
const buttonGap = cellHeight;

const leftMargin = cellWidth;
const topMargin = cellHeight;

const svgWidth = leftMargin * 2 + maxNumCols * cellWidth;
const svgHeight = topMargin * 2 + maxNumRows * cellHeight + buttonGap + buttonHeight;

/**
 * Initialize the SVG.
 */
function initSVG() {
    d3.select("#animateMathSection")
        .append("svg")
        .attr("id", "animateMathSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Cell Wrappers
    const wrappers = d3.select("#animateMathSvg")
        .selectAll(".cellWrapper")
        .data(Array(maxNumCells))
        .enter()
        .append("g")
        .attr("transform", `translate(${-svgWidth}, ${-svgHeight})`)
        .classed("cellWrapper", true);
    
    // Cell Color and Outline
    wrappers.append("rect")
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", "white")
        .attr("stroke", config.borderColor)
        .attr("stroke-width", config.borderWidth)
        .classed("cellColor", true);

    // Cell Text
    wrappers.append("text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize)
        .classed("cellText", true);

    // Button Wrappers
    const prevButtonWrapper = d3.select("#animateMathSvg")
        .append("g")
        .attr("id", "prevButtonWrapper")
        .attr("transform", `translate(${(svgWidth / 2) - buttonWidth}, ${topMargin + maxNumRows * cellHeight + buttonGap})`)
        .style("cursor", "pointer")
        .on("click", prevFrame);
    const nextButtonWrapper = d3.select("#animateMathSvg")
        .append("g")
        .attr("id", "nextButtonWrapper")
        .attr("transform", `translate(${svgWidth / 2}, ${topMargin + maxNumRows * cellHeight + buttonGap})`)
        .style("cursor", "pointer")
        .on("click", nextFrame);

    // Button Colors
    prevButtonWrapper.append("rect")
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.prevColor)
        .attr("id", "prevButtonColor");
    nextButtonWrapper.append("rect")
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.nextColor)
        .attr("id", "nextButtonColor");

    // Button Texts
    prevButtonWrapper.append("text")
        .attr("id", "prevButtonText")
        .attr("x", buttonWidth / 2)
        .attr("y", buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", config.fontSize)
        .text("Prev");
    nextButtonWrapper.append("text")
        .attr("id", "nextButtonText")
        .attr("x", buttonWidth / 2)
        .attr("y", buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", config.fontSize)
        .text("Next");
}

function drawFrame(useTransition = true) {
    let t;

    const frameData = frames[curFrame];
    const numCells = frameData.matrices.length * frameData.matrices[0].length * frameData.matrices[0][0].length;

    const leftPadding = leftMargin + cellWidth * ((maxNumCols - ((frameData.matrices[0][0].length) * frameData.matrices.length + gapSize * (frameData.matrices.length - 1))) / 2);
    const topPadding = topMargin + ((maxNumRows - frameData.matrices[0].length) / 2) * cellHeight;

    t = useTransition ?
        d3.transition().duration(textAnimationDuration / 2).ease(d3.easeCubic) :
        null;

    d3.select("#animateMathSvg")
        .selectAll(".cellWrapper")
        .data(frameData.paddedCells)
        .transition(t)
        .attr("transform", (_, i) => {
            i = i % numCells;

            const matrixI = Math.floor(i / (frameData.matrices[0].length * frameData.matrices[0][0].length));
            const rowI = Math.floor((Math.floor(i % (frameData.matrices[0].length * frameData.matrices[0][0].length))) / frameData.matrices[0][0].length);
            const colI = (Math.floor(i % (frameData.matrices[0].length * frameData.matrices[0][0].length))) % frameData.matrices[0][0].length;

            const matrixGap = frameData.separator !== null ?
                                cellWidth * (frameData.matrices[0][0].length + 1) :
                                0;

            return `translate(${leftPadding + matrixI * matrixGap + colI * cellWidth}, ${topPadding + rowI * cellHeight})`;
        });

    t = useTransition ?
        d3.transition().duration(textAnimationDuration / 2).ease(d3.easeCubic):
        null;
    d3.select("#animateMathSvg")
        .selectAll(".cellText")
        .data(frameData.paddedCells)
        .transition(t)
        .attr("fill", "white")
        .on("end", appearText);
    
    function appearText() {
        t = useTransition ?
            d3.transition().duration(textAnimationDuration / 2).ease(d3.easeCubic):
            null;
        d3.select("#animateMathSvg")
            .selectAll(".cellText")
            .data(frameData.paddedCells)
            .text(d => d)
            .transition(t)
            .attr("fill", "black");
    }
}

function prevFrame() {
    --curFrame;
    drawFrame();
}
function nextFrame() {
    ++curFrame;
    drawFrame();
}
