import calculations from "../shared/calculations"
import scraper from "../shared/scraper"
import betaviz from "../shared/betaviz";

let noDistProducts = []
let scrollTicking = false


;(async ()=> {
    const products = await scraper.findAllProducts()
    for (let product of products) {
        if(!product.reviewCount) continue
        insertBetaViz(product)
        dumpAvgConfidence(product)
    }
    noDistProducts = products
    window.addEventListener('resize', handleScroll)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
})()



function dumpAvgConfidence(product){
    const confidenceDOM = document.createElement("div");
    confidenceDOM.style.marginTop = '.5em'
    const ci = calculations.evaluateAverageRating(product.rating, product.reviewCount)
    confidenceDOM.innerHTML = `AVG CI for ${product.rating}, n=${product.reviewCount} is <br> proportion: ${ci.proportion} <br> lower: ${ci.lower} <br> upper: ${ci.upper}`;
    product.dom.insertAdjacentElement("beforeend", confidenceDOM);
}


/**
 * For each product, create a beta distribution visualization and insert it into the DOM
 */
function insertBetaViz(product){
    // Create color scale
    const cmap = "interpolateSpectral";
    const ratingText = product.querySelector("span.a-icon-alt").innerText;
    const rating = +ratingText.split(" out of")[0]; //score out of 5
    const reviewsText = product.querySelector("span.a-size-base").innerText; //number of reviews
    const reviews = parseFloat(reviewsText.replace(/[,.]/g, ""));
    const confidenceDOM = document.createElement("div");
    const proportion = calculations.getProportionPositiveFromAvg(rating);
    const betaParams = calculations.getBetaParams(proportion, reviews);
    betaviz.addViz(confidenceDOM, betaParams, cmap);
    product.insertAdjacentElement("beforeend", confidenceDOM);
}


function handleScroll(evt){
    if(scrollTicking)  return
    scrollTicking = true
    window.requestAnimationFrame(()=>{
        const leftover = []
        for(let product of noDistProducts) {
            if (productInView(product)){
                // noinspection JSIgnoredPromiseFromCall
                dumpDistConfidence(product)
            }
            else {
                leftover.push(product)
            }
        }
        noDistProducts = leftover
        scrollTicking = false
    })
}


async function dumpDistConfidence(product){
    await scraper.loadDistributions(product)
    const confidenceDOM = document.createElement("div");
    confidenceDOM.style.marginTop = '.5em'
    const ci = calculations.evaluateRatings(product.distributions, product.reviewCount)
    confidenceDOM.innerHTML = `DIST CI for ${product.distributions}, n=${product.reviewCount} is <br> proportion: ${ci.proportion} <br> lower: ${ci.lower} <br> upper: ${ci.upper}`;
    product.dom.insertAdjacentElement("beforeend", confidenceDOM);
}


function productInView(product){
    const rect = product.dom.getBoundingClientRect();
    const view = {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
    }
    return (
        rect.right >= view.left
        && rect.left <= view.right
        && rect.bottom >= view.top
        && rect.top <= view.bottom
    );
}
