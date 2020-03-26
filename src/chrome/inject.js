import calculations from "../shared/calculations"
import scraper from "../shared/scraper"


(async ()=> {
    const products = await scraper.findAllProducts()
    for (let product of products) {
        if(!product.reviewCount) continue
        const confidenceDOM = document.createElement("div");
        const ci = calculations.evaluateAverageRating(product.rating, product.reviewCount)
        confidenceDOM.innerHTML = `CI for score ${product.rating}, n=${product.reviewCount} is <br> proportion: ${ci.proportion} <br> lower: ${ci.lower} <br> upper: ${ci.upper}`;
        product.dom.insertAdjacentElement("beforeend", confidenceDOM);
    }
})()
