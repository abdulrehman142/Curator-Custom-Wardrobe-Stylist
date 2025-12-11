# app/web_scraper.py
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# URLs to scrape
SCRAPING_URLS = {
    "hoodies": "https://www2.hm.com/en_us/men/products/hoodies-sweatshirts.html",
    "cargo pants": "https://www2.hm.com/en_us/men/products/pants/cargo-pants.html",
    "jeans": "https://www2.hm.com/en_us/men/products/jeans.html",
    "t-shirts": "https://www2.hm.com/en_us/men/products/t-shirts-tank-tops.html",
    "tshirts": "https://www2.hm.com/en_us/men/products/t-shirts-tank-tops.html",
    "shirts": "https://www2.hm.com/en_us/men/products/shirts.html",
    "blazers": "https://www2.hm.com/en_us/men/products/suits-blazers/blazers.html",
    "suits": "https://www2.hm.com/en_us/men/products/suits-blazers/suits.html",
    "sweaters": "https://www2.hm.com/en_us/men/products/cardigans-sweaters/sweaters.html",
    "sweatshirts": "https://www2.hm.com/en_us/men/products/hoodies-sweatshirts.html",
    "jackets": "https://www2.hm.com/en_us/men/products/jackets-coats.html",
    "trousers": "https://www2.hm.com/en_us/men/products/pants.html",
    "track pants": "https://www2.hm.com/en_us/men/products/pants.html",
    "shorts": "https://www2.hm.com/en_us/men/products/shorts.html",
}

# Mapping from our wardrobe item names to H&M categories
ITEM_TO_CATEGORY = {
    "Tshirts": "t-shirts",
    "Shirts": "shirts",
    "Jeans": "jeans",
    "Sweatshirts": "sweatshirts",
    "Sweaters": "sweaters",
    "Blazers": "blazers",
    "Suits": "suits",
    "Jackets": "jackets",
    "Trousers": "trousers",
    "Track Pants": "track pants",
    "Shorts": "shorts",
    "Hoodies": "hoodies",
}


def get_chrome_driver(headless: bool = True):
    """Create and return a Chrome WebDriver instance"""
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    
    try:
        # Try to use ChromeDriver
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        logger.error(f"Failed to create Chrome driver: {e}")
        logger.error("Make sure ChromeDriver is installed and in PATH, or install webdriver-manager")
        # Optionally, you could use webdriver-manager here:
        # from webdriver_manager.chrome import ChromeDriverManager
        # driver = webdriver.Chrome(ChromeDriverManager().install(), options=chrome_options)
        return None


def _normalize_hm_image_url(url: Optional[str]) -> Optional[str]:
    """Ensure H&M image URLs are absolute and usable."""
    if not url:
        return None
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("/"):
        return f"https://image.hm.com{url}"
    if url.startswith("image.hm.com"):
        return f"https://{url}"
    return url


def scrape_hm_products(category: str, limit: int = 3) -> List[Dict]:
    """
    Scrape H&M products for a given category
    
    Args:
        category: The clothing category to scrape
        limit: Maximum number of products to return
        
    Returns:
        List of product dictionaries
    """
    url = SCRAPING_URLS.get(category.lower())
    if not url:
        logger.warning(f"No URL found for category: {category}")
        return []
    
    driver = None
    try:
        driver = get_chrome_driver(headless=True)
        if not driver:
            logger.error("Failed to initialize Chrome driver")
            return []
        
        driver.get(url)
        time.sleep(3)  # Allow page to load
        
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        
        section = soup.find("div", id="products-listing-section")
        if not section:
            logger.warning(f"Failed to find products section for {url}")
            return []
        
        items = section.find_all("li", limit=limit)
        products = []
        
        for li in items:
            try:
                # Title
                title_tag = li.find("h2")
                title = title_tag.get_text(strip=True) if title_tag else "Unknown Product"
                
                # Link
                link_tag = li.find("a", href=True)
                link = None
                if link_tag:
                    href = link_tag.get('href', '')
                    if href.startswith('http'):
                        link = href
                    else:
                        link = "https://www2.hm.com" + href
                
                # Price
                price_tag = li.find("span", class_="d16b8d")
                if not price_tag:
                    price_tag = li.find("span", class_=lambda x: x and "price" in x.lower())
                price = price_tag.get_text(strip=True) if price_tag else "Price not available"
                
                # Default image
                img_tag = li.find("img", {"data-src": True})
                if not img_tag:
                    img_tag = li.find("img", {"src": True})
                
                default_image = None
                if img_tag:
                    default_image = img_tag.get("data-src") or img_tag.get("src")
                default_image = _normalize_hm_image_url(default_image)
                
                # Hover image
                hover_image = None
                if img_tag:
                    hover_image = img_tag.get("data-altimage") or img_tag.get("data-hover")
                hover_image = _normalize_hm_image_url(hover_image)
                
                # Colors
                color_spans = li.find_all("span", style=True)
                colors = []
                for span in color_spans:
                    style = span.get('style', '')
                    if "background-color" in style:
                        color = style.replace("background-color:", "").strip()
                        if color:
                            colors.append(color)
                
                products.append({
                    "category": category,
                    "title": title,
                    "link": link,
                    "price": price,
                    "default_image": default_image,
                    "hover_image": hover_image,
                    "colors": colors
                })
            except Exception as e:
                logger.error(f"Error parsing product item: {e}")
                continue
        
        return products
        
    except Exception as e:
        logger.error(f"Error scraping {category}: {e}")
        return []
    finally:
        if driver:
            driver.quit()


def get_recommendations_for_items(item_names: List[str], limit_per_item: int = 3) -> Dict[str, List[Dict]]:
    """
    Get web-scraped recommendations for a list of clothing items
    
    Args:
        item_names: List of clothing item names
        limit_per_item: Number of products to scrape per item
        
    Returns:
        Dictionary mapping item names to their scraped products
    """
    results = {}
    
    for item_name in item_names:
        category = ITEM_TO_CATEGORY.get(item_name)
        if category:
            products = scrape_hm_products(category, limit=limit_per_item)
            if products:
                results[item_name] = products
        else:
            logger.debug(f"No scraping category found for: {item_name}")
    
    return results

