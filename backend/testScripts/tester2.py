from selenium import webdriver
from bs4 import BeautifulSoup

driver = webdriver.Chrome()  # or use Firefox
driver.get("https://www2.hm.com/en_us/men/products/cardigans-sweaters/sweaters.html")

html = driver.page_source
soup = BeautifulSoup(html, "html.parser")

section = soup.find("div", id="products-listing-section")
items = section.find_all("li", limit=3)

for li in items:
    title = li.find("h2").get_text(strip=True)
    print(title)

driver.quit()
