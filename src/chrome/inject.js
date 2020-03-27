import calculations from "../shared/calculations"
import scraper from "../shared/scraper"


let noDistProducts = []
let scrollTicking = false


;(async ()=> {
    const products = await scraper.findAllProducts()
    for (let product of products) {
        if(!product.reviewCount) continue
        dumpAvgConfidence(product)
    }
    noDistProducts = products
    window.addEventListener('resize', handleScroll)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
})()



function dumpAvgConfidence(product){
    const confidenceDOM = document.createElement("div");
    const ci = calculations.evaluateAverageRating(product.rating, product.reviewCount)
    confidenceDOM.innerHTML = `CI for score ${product.rating}, n=${product.reviewCount} is <br> proportion: ${ci.proportion} <br> lower: ${ci.lower} <br> upper: ${ci.upper}`;
    product.dom.insertAdjacentElement("beforeend", confidenceDOM);
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
    scraper.getDistribution(product)
    product.dom.style.backgroundColor = 'blue'
}


function productInView(product){
    const rect = product.dom.getBoundingClientRect();
    const view = {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
    }
    return !(
        rect.right < view.left
        || rect.left > view.right
        || rect.bottom < view.top
        || rect.top > view.bottom
    );
}
