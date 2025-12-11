from selenium import webdriver
from bs4 import BeautifulSoup
import time
import pandas as pd

# URLs to scrape
urls = {
    "hoodies": "https://www2.hm.com/en_us/men/products/hoodies-sweatshirts.html",
    "cargo pants": "https://www2.hm.com/en_us/men/products/pants/cargo-pants.html",
    "jeans": "https://www2.hm.com/en_us/men/products/jeans.html",
    "t-shirts": "https://www2.hm.com/en_us/men/products/t-shirts-tank-tops.html",
    "shirts": "https://www2.hm.com/en_us/men/products/shirts.html",
    "blazers": "https://www2.hm.com/en_us/men/products/suits-blazers/blazers.html",
    "suits": "https://www2.hm.com/en_us/men/products/suits-blazers/suits.html",
    "sweaters": "https://www2.hm.com/en_us/men/products/cardigans-sweaters/sweaters.html"
}

driver = webdriver.Chrome()  # or Firefox
data = []

for category, url in urls.items():
    driver.get(url)
    time.sleep(2)  # allow page to load
    
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    
    section = soup.find("div", id="products-listing-section")
    if not section:
        print(f"Failed to find products section for {url}")
        continue
    
    items = section.find_all("li", limit=3)
    
    for li in items:
        # Title
        title_tag = li.find("h2")
        title = title_tag.get_text(strip=True) if title_tag else None
        
        # Link
        link_tag = li.find("a", href=True)
        link = "https://www2.hm.com" + link_tag['href'] if link_tag else None
        
        # Price
        price_tag = li.find("span", class_="d16b8d")
        price = price_tag.get_text(strip=True) if price_tag else None
        
        # Default image
        img_tag = li.find("img", {"data-src": True})
        default_image = img_tag["data-src"] if img_tag else None
        
        # Hover image
        hover_image = img_tag.get("data-altimage") if img_tag else None
        
        # Colors
        color_spans = li.find_all("span", style=True)
        colors = [span['style'].replace("background-color:", "").strip() for span in color_spans if "background-color" in span['style']]
        
        data.append({
            "category": category,
            "title": title,
            "link": link,
            "price": price,
            "default_image": default_image,
            "hover_image": hover_image,
            "colors": colors
        })

driver.quit()

# Save to DataFrame
df = pd.DataFrame(data)
df.to_csv("hm_products.csv", index=False)