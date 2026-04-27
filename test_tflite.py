import numpy as np
import tensorflow as tf

interpreter = tf.lite.Interpreter(model_path='assets/models/atik_tanima_modeli.tflite')
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()[0]
output_details = interpreter.get_output_details()[0]

# Rastgele gürültü testi [0, 255]
dummy_data_255 = np.random.randint(0, 255, size=(1, 224, 224, 3)).astype(np.float32)

interpreter.set_tensor(input_details['index'], dummy_data_255)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details['index'])[0]
print("0-255 Gurultu Sonucu:", output_data)
print("0-255 Gurultu Max Class:", np.argmax(output_data))

# Rastgele gürültü testi [-1, 1]
dummy_data_norm = (dummy_data_255 / 127.5) - 1.0
interpreter.set_tensor(input_details['index'], dummy_data_norm)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details['index'])[0]
print("-1 to 1 Gurultu Sonucu:", output_data)
print("-1 to 1 Gurultu Max Class:", np.argmax(output_data))

# Siyah resim testi [-1, 1]
dummy_data_black = np.ones((1, 224, 224, 3), dtype=np.float32) * -1.0
interpreter.set_tensor(input_details['index'], dummy_data_black)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details['index'])[0]
print("Siyah Resim (-1) Sonucu:", output_data)
print("Siyah Resim (-1) Max Class:", np.argmax(output_data))

# Beyaz resim testi [-1, 1]
dummy_data_white = np.ones((1, 224, 224, 3), dtype=np.float32) * 1.0
interpreter.set_tensor(input_details['index'], dummy_data_white)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details['index'])[0]
print("Beyaz Resim (1) Sonucu:", output_data)
print("Beyaz Resim (1) Max Class:", np.argmax(output_data))
