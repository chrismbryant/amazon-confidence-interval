import calculations from "./calculations";
import * as d3 from "d3";
import "d3-selection-multi";

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
     * @param {object} colorScale - linear D3 color scale
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
     * @param {object} colorScale - D3 color scale to use for violin plot fill
     */
    addViz(confidenceDOM, betaParams, colorScale) {

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

        // Specify parameters of visualization bounding rectangle
        const rectParams = {
            x: 0,
            y: 0,
            rx: 10,
            width: width,
            height: height
        };

        // Create SVG
        var svg = d3.select(confidenceDOM)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Function to scale X values
        const scaleX = d3.scaleLinear()
            .domain([0, xMax])
            .range([0, width])

        // Function to scale Y values
        const scaleY = d3.scaleLinear()
            .domain([0, yMax])
            .range([0, height / 2 - padding])

        // Specify coordinates of Beta distribution violin plot
        const area = d3.area()
            .curve(d3.curveLinear)
            .x(d => scaleX(d[0]))
            .y0(d => height / 2 + scaleY(d[1]))
            .y1(d => height / 2 - scaleY(d[1]));

        // Add a defs element to SVG
        var defs = svg.append("defs");

        // Add a gradient element to defs
        defs.append("linearGradient")
            .attr("id", "color-gradient")
            .selectAll("stop")
            .data(colorScale.range())
            .enter().append("stop")
            .attr("offset", function(d, i) {return i / (colorScale.range().length - 1);})
            .attr("stop-color", function(d) {return d;});

        // Add a soft shadow filter to defs
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

        // Add mask to prevent plot from spilling outside of its rectangle
        svg.append("mask")
            .attr("id", "viz-mask")
            .append("rect")
                .attrs(rectParams)
                .attr("fill", "white");

        // Add element to group visualization content together
        var g = svg.append("g")
            .attr("id", "viz-content")
            .attr("mask", "url(#viz-mask)");

        // Create rounded rectangle to contain visualization
        g.append("rect")
            .attrs(rectParams)
            .attr("fill", "#e9e9e9");

        // Add Beta distribution violin plot to SVG
        g.append("path")
            .datum(data)
            .attr("d", area)
            .attr("fill", "url(#color-gradient)");

        // Specify triangle configuration
        const triangleConfig = {
            "top": {"up": false, "y": 0},
            "bottom": {"up": true, "y": height}
        };

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
         * @param {HTMLElement} triangleTicks - svg element
         * @param {Object.<string, number>} betaParams - distribution parameters
         * @param {string} position - triangle placement, either "top" or "bottom" 
         */
        function addTriangleTick(triangleTicks, betaParams, position) {
            const numPositive = betaParams["numPositive"];
            const numRatings = betaParams["numRatings"];
            triangleTicks.append("path")
                .attr("id", `${position}-triangle`)
                .attr("fill", "white")
                .attr("d", trianglePath(triangleSize, triangleConfig[position]["up"]))
                .attr("filter", "url(#soft-shadow)")
                .attr("transform", function(d) {
                    const x = numPositive / numRatings * width;
                    const y = triangleConfig[position]["y"];
                    return "translate(" + x + "," + y + ")";
                });
        }

        /** 
         * Add triangle ticks pointing to distribution peak
         * @param {HTMLElement} g - svg group elemnt
         * @param {Object.<string, number>} betaParams - distribution parameters
         */
        function addTriangleTicks(g, betaParams) {
            var triangleTicks = g.append("g")
                .attr("id", "triangle-ticks");
            addTriangleTick(triangleTicks, betaParams, "top");
            addTriangleTick(triangleTicks, betaParams, "bottom");
        }
        
        // Add triangle ticks to SVG
        addTriangleTicks(g, betaParams);

    }
}

