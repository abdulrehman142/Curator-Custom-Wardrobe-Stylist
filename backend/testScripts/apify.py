import requests
import pandas as pd

ALGOLIA_URL = "https://hgr051i5xn-dsn.algolia.net/1/indexes/*/queries"
HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'accept': 'application/json',
}

# ---- Core function: fetch products for a style ----
def fetch_hm_style(style_name, max_items=3):
    payload = {
        "requests": [
            {
                "indexName": "01live_hmeg_product_list",
                "params": (
                    f"query={style_name}"
                    f"&hitsPerPage={max_items}"
                    f"&page=0"
                    f"&filters=(stock > 0)"
                    f"&attributesToRetrieve=*"
                )
            }
        ]
    }

    r = requests.post(
        ALGOLIA_URL +
        "?x-algolia-agent=PythonScraper"
        "&x-algolia-application-id=HGR051I5XN"
        "&x-algolia-api-key=a2fdc9d456e5e714d8b654dfe1d8aed8",
        headers=HEADERS,
        json=payload,
    )
    r.raise_for_status()
    data = r.json()["results"][0]["hits"]

    results = []
    for item in data:
        results.append({
            "Title": item.get("title", {}).get("en", "N/A"),
            "Price": item.get("attr_selling_price", {}).get("en", ["N/A"])[0],
            "Colors": ",".join(item.get("attr_color_label", {}).get("en", [])),
            "Sizes": ",".join(item.get("attr_size", {}).get("en", [])),
            "Style": style_name,
            "URL": "https://eg.hm.com" + item["url"]["en"] if "url" in item else None
        })

    return results

# ---- Define styles here ----
styles = [
    "t-shirt",
    "shirt",
    "hoodie",
    "jacket",
    "jeans",
    "trousers",
    "shorts",
    "knitwear"
]

# ---- Run scraper for all styles ----
all_items = []
for style in styles:
    print(f"Fetching {style}...")
    items = fetch_hm_style(style, max_items=3)
    if not items:
        print(f"⚠️ No results for {style}")
    all_items.extend(items)

df = pd.DataFrame(all_items)
df.to_csv("hm_products.csv", index=False)