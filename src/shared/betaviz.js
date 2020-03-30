import calculations from "./calculations";
import * as d3 from "d3";
import "d3-selection-multi";
import {v4 as uuidv4} from "uuid";

export default {
    /**
     * Create basic CI text based on rating data.
     * @param {Object.<string, (number|number[])>} ratingData - object containing
     *     the average rating under key "avg" and/or the 5-element rating
     *     distribution (fraction of ratings at each star value) under key "dist".
     * @param {number} numRatings - total number of ratings for this product.
     * @param {string} method - which method to use to compute proportion of
     *     reviews which were positive; must be either "avg" or "dist".
     * @returns {string} html - HTML output string with basic CI text.
     */
    createBasicText(ratingData, numRatings, method = "avg") {
        const ci = calculations.evaluateRatings(ratingData, numRatings, method);
        var avgRatingText = "";
        if ("avg" in ratingData) {
            avgRatingText = `score ${ratingData['avg']}, `
        }
        const lines = [
            `CI for ${avgRatingText}n=${numRatings} is`,
            `proportion: ${ci.proportion}`,
            `lower: ${ci.lower}`,
            `upper: ${ci.upper}`
        ];
        const html = lines.join(" <br> ");
        return html;
    },

    /**
     * Get a linear D3 color scale based on a D3 color map.
     * @param {string} cmap - D3 color map
     * @param {Object} colorScale - linear D3 color scale
     */
    getColorScale(cmap = "interpolateSpectral") {
        const numSteps = 100;
        const colorRange = d3.range(numSteps).map(d => {
            return d3[cmap](d / (numSteps - 1));
        });
        const colorScale = d3.scaleLinear().range(colorRange);
        return colorScale;
    },

    /**
     * Create an SVG with a beta distribution violin plot visualization.
     * @param {HTMLElement} confidenceDOM - HTML element in which to embed the SVG
     * @param {Object.<string, number>} betaParams - distribution parameters
     * @param {string} cmap - D3 color map name
     */
    addViz(confidenceDOM, betaParams, cmap) {

        // Config
        const width = 200;
        const height = 60;
        const padding = 10;
        const triangleSize = 10;

        const alpha = betaParams["alpha"];
        const beta = betaParams["beta"];
        const proportion = betaParams["proportion"];
        const data = calculations.getBetaPDF(alpha, beta);
        const xMax = d3.max(d3.transpose(data)[0]);
        const yMax = d3.max(d3.transpose(data)[1]);
        const uuid = uuidv4().split("-")[0];
        const colorScale = this.getColorScale(cmap);
        const grayScale = cmapToGrayScale(cmap, true);

        // Specify parameters of visualization bounding rectangle
        const rectParams = {
            x: 0,
            y: 0,
            rx: 10,
            width: width,
            height: height
        };

        // Specify colors to be used for "dark" and "light" color modes
        const colorConfig = {
            "dark": "#a0a0a0",
            "light": "white"
        };

        // Specify triangle configuration
        const triangleConfig = {
            "top": {"up": false, "y": 0},
            "bottom": {"up": true, "y": height}
        };

        /** 
         * Create SVG
         * @param {HTMLElement} element - element to place SVG within
         * @param {number} width - SVG width
         * @param {number} height - SVG height
         * @returns {HTMLElement} svg - SVG node
         */
        function makeSVG(element, width, height) {
            var svg = d3.select(confidenceDOM)
                .append("svg")
                .attr("id", `svg-${uuid}`)
                .attr("width", width)
                .attr("height", height);
            return svg;
        }

        /** 
         * Create the SVG path string for the beta distribution violin plot
         * @param {number[][]} data - array of distribution [x, y] coordinate pairs
         * @returns {string} - distribution SVG path string
         */
        function getDistPath(data) {

            // Function to scale X values
            const scaleX = d3.scaleLinear()
                .domain([0, xMax])
                .range([0, width])

            // Function to scale Y values
            const scaleY = d3.scaleLinear()
                .domain([0, yMax])
                .range([0, height / 2 - padding])

            // Function to specify path of Beta distribution violin plot
            const distPath = d3.area()
                .curve(d3.curveLinear)
                .x(d => scaleX(d[0]))
                .y0(d => height / 2 + scaleY(d[1]))
                .y1(d => height / 2 - scaleY(d[1]));

            return distPath(data);
        }

        /** 
         * Add gradient def for color scale
         * @param {HTMLElement} defs - SVG defs node
         * @param {Object} colorScale - D3 color scale object
         */
        function defGradient(defs, colorScale, name) {
            defs.append("linearGradient")
                .attr("id", `${name}-gradient`)
                .selectAll("stop")
                .data(colorScale.range())
                .enter().append("stop")
                .attr("offset", function(d, i) {return i / (colorScale.range().length - 1);})
                .attr("stop-color", function(d) {return d;});
        }

        /**
         * Add soft shadow filter def for triangle tick markers
         * @param {HTMLElement} defs - SVG defs node
         */
        function defShadowFilter(defs) {
            // Add a soft shadow filter def
            var shadowFilter = defs.append("filter")
                .attr("id", "soft-shadow")
                .attr("x", "-50%")
                .attr("y", "-50%")
                .attr("width", "200%")
                .attr("height", "200%")
            shadowFilter.append("feOffset")
                .attr("result", "offOut")
                .attr("in", "SourceAlpha")
                .attr("dx", 0)
                .attr("dy", 0)
            shadowFilter.append("feGaussianBlur")
                .attr("result", "blurOut")
                .attr("in", "offOut")
                .attr("stdDeviation", 1)
            shadowFilter.append("feBlend")
                .attr("in", "SourceGraphic")
                .attr("in2", "blurOut")
                .attr("mode", "normal")
        }

        /** 
         * Create content group so that viz contents are organized in the DOM
         * @param {HTMLElement} svg - SVG node
         * @returns {HTMLElement} g - content group node
         */
        function makeContentGroup(svg) {
            var g = svg.append("g")
                .attr("class", "viz-content")
                .attr("mask", `url(#viz-content-mask-${uuid})`);
            return g;
        }

        /** 
         * Add masks to SVG to help with image composition
         * @param {HTMLElement} svg - SVG node
         * @param {Object} rectParams - object containing SVG rectangle attributes
         * @param {string} distPath - distribution SVG path string
         */
        function addMasks(svg, rectParams, distPath) {

            // Make masks group
            var masks = svg.append("g")
                .attr("class", "viz-masks")

            // Add mask to prevent plot from spilling outside of its rectangle
            masks.append("mask")
                .attr("id", `viz-content-mask-${uuid}`)
                .append("rect")
                    .attrs(rectParams)
                    .attr("fill", "white");

            // Add mask to switch between dark and light modes when occluded by beta viz
            masks.append("mask")
                .attr("id", `viz-dist-mask-${uuid}`)
                .append("path")
                    .attr("d", distPath)
                    .attr("fill", "white");
                    // .attr("fill", "url(#gray-gradient)");
        }

        /**
         * Add rounded rectangle to contain SVG content visually
         * @param {HTMLElement} g - content group node
         * @param {Object} rectParams - object containing SVG rectangle attributes
         */
        function addVizRectangle(g, rectParams) {
            g.append("g")
                .attr("class", "viz-rectangle-group")
                .append("rect")
                    .attr("class", "viz-rectangle")
                    .attrs(rectParams)
                    .attr("fill", "#e9e9e9");
        }

        /**
         * Add beta distribution violin plot to SVG
         * @param {HTMLElement} g - content group node
         * @param {string} distPath - distribution SVG path string
         */
        function addBetaViolin(g, distPath) {
            g.append("g")
                .attr("class", "viz-dist-group")
                .append("path")
                    .attr("class", "viz-dist")
                    .attr("d", distPath)
                    .attr("fill", "url(#color-gradient)");
        }

        /** 
         * Create SVG path for an equilaterial triangle.
         * @param {number} size - length of triangle side, in number of pixels
         * @param {boolean} up - whether triangle points up (vs. down)
         * @returns {string} path - SVG path element string
         */
        function trianglePath(size = 10, up = true) {
            const sign = up ? -1 : 1;
            var path = `M ${-size / 2} 0 `;
            path += `L ${size / 2} 0`;
            path += `L 0 ${sign * size * Math.sqrt(3) / 2} Z`;
            return path;
        }

        /** 
         * Add a triangle tick at the beta distribution peak, either on "top"
         * or on "bottom" of the distribution.
         * @param {HTMLElement} g - SVG group element
         * @param {Object.<string, number>} betaParams - distribution parameters
         * @param {string} position - triangle placement, either "top" or "bottom" 
         */
        function addTriangleTick(g, betaParams, position) {
            const numPositive = betaParams["numPositive"];
            const numRatings = betaParams["numRatings"];
            g.append("path")
                .attr("class", `${position}-triangle`)
                .attr("fill", "white")
                .attr("d", trianglePath(triangleSize, triangleConfig[position]["up"]))
                .attr("transform", function(d) {
                    const x = numPositive / numRatings * width;
                    const y = triangleConfig[position]["y"];
                    return "translate(" + x + "," + y + ")";
                });
        }

        /** 
         * Add triangle ticks pointing to distribution peak
         * @param {HTMLElement} g - SVG group elemnt
         * @param {Object.<string, number>} betaParams - distribution parameters
         */
        function addTriangleTicks(g, betaParams) {
            var triangleTicks = g.append("g")
                .attr("class", "triangle-ticks")
                .attr("filter", "url(#soft-shadow)");
            addTriangleTick(triangleTicks, betaParams, "top");
            addTriangleTick(triangleTicks, betaParams, "bottom");
        }
        
        /**
         * Make group node to contain visualization axis shapes
         * @param {HTMLElement} g - parent group node
         * @param {HTMLElement} - new group node
         */
        function makeAxisShapeGroup(g) {
            return g.append("g").attr("class", "axis-shapes");
        }

        /**
         * Add vertical line through center of SVG
         * @param {HTMLElement} g - axis shapes group node
         */
        function addCenterLine(g) {
            const x = width / 2;
            const path = `M ${x} 0 V ${height}`;
            g.append("path")
                .attr("class", `axis-center-line`)
                .attr("d", path)
                .attr("stroke", colorConfig["dark"]);
        }

        /**
         * Add dots to show each 10% increment along the distribution x-axis
         * @param {HTMLElement} g - axis shapes group node
         * @param {string} colorMode - "dark" or "light"
         * @param {boolean} applyMask - whether to use the distribution to mask the points
         */
        function addAxisDots(g, colorMode, applyMask) {

            // Add group node to hold all dots
            var axisDots = g.append("g")
                .attr("class", `axis-dots-${colorMode}`);

            // Show dots only where they occlude the distribution viz
            if (applyMask) {
                axisDots.attr("mask", `url(#viz-dist-mask-${uuid})`);
            }

            // Create one dot for all 1/10th increments except the center position
            for (var i = 1; i <= 9; i++) {
                if (i == 5) {
                    continue;
                }
                const x = i / 10 * width;
                const y = height / 2;
                axisDots.append("circle")
                    .attr("r", 1.5)
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("fill", colorConfig[colorMode]);
            }
        }
        
        // Beta distribution violin plot SVG path
        const distPath = getDistPath(data);
        
        // Create SVG with defs and masks
        var svg = makeSVG(confidenceDOM, width, height);
        var defs = svg.append("defs");
        defGradient(defs, colorScale, "color");
        defGradient(defs, grayScale, "gray");
        defShadowFilter(defs);
        addMasks(svg, rectParams, distPath);

        // Add visual content to SVG
        var g = makeContentGroup(svg);
        addVizRectangle(g, rectParams);
        addBetaViolin(g, distPath);

        // Add accessory shapes to SVG
        var axisShapes = makeAxisShapeGroup(g);
        addCenterLine(axisShapes);
        addAxisDots(axisShapes, "dark", false);
        addAxisDots(axisShapes, "light", true);
        addTriangleTicks(axisShapes, betaParams);

    }
}

/** 
 * Convert an RGB 255 string to luminosity.
 * See https://stackoverflow.com/questions/687261/converting-rgb-to-grayscale-intensity
 * @param {string} rgbString - string like "rgb(180, 24, 89)"
 * @return {number} lum - integer luminosity value between 0 and 255
 */
function rgbToLum(rgbString) {
    const rgb = rgbString.split(")")[0].split("(")[1].split(", ").map(d => d * 1);
    const lum = Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);
    return lum;
}

/** 
 * Create a linear grayscaled D3 color scale from an input arbitrary D3 color map.
 * @param {string} cmap - D3 color map
 * @param {boolean} inverted - whether luminosity values should be inverted
 * @returns {Object} grayScale - D3 color scale object
 */
function cmapToGrayScale(cmap, inverted = false) {
    const numSteps = 100;
    const colorRange = d3.range(numSteps).map(d => {
        const rgbString = d3[cmap](d / (numSteps - 1));
        const lum = rgbToLum(rgbString);
        const l = inverted ? 255 - lum : lum;
        return `rgb(${l}, ${l}, ${l})`;
    });
    const grayScale = d3.scaleLinear().range(colorRange);
    return grayScale;
}


