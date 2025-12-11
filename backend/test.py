from app.detector import classify_image_bytes
with open("C:/Users/Raahim/Downloads/images.jpg","rb") as f:
    print(classify_image_bytes(f.read(), topk=3))
