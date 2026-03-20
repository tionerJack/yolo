# Visión Artificial — Actividad Integradora 2

Este proyecto es una aplicación web desarrollada con Flutter para la **Universidad TENAM**, que implementa dos módulos de visión artificial:

1.  **Detección de Rostros (ESP32-CAM Sim)**: Utiliza `face-api.js` para detectar rostros, expresiones y puntos faciales en tiempo real, simulando el flujo de una ESP32-CAM.
2.  **Detección de Objetos YOLO**: Implementa YOLO (You Only Look Once) mediante `ml5.js` para la detección de 80 clases diferentes de objetos sobre el stream de la cámara.

## 🚀 Demo en Vivo

Puedes probar la aplicación desplegada en Firebase Hosting aquí:
**[https://tenam-vision-yolo-1773976989.web.app/](https://tenam-vision-yolo-1773976989.web.app/)**

## Tecnologías Utilizadas

- **Flutter Web**: Framework principal de la UI.
- **face-api.js**: Biblioteca de JavaScript para detección facial.
- **ml5.js / TensorFlow.js**: Para el modelo YOLO de detección de objetos.
- **Firebase Hosting**: Despliegue y hosting de la aplicación.

## Estructura del Proyecto

- `lib/main.dart`: Lógica principal de la aplicación y TabBar.
- `web/face_detection.js`: Integración de face-api.
- `web/yolo.js`: Integración de YOLO con ml5.js.
- `web/index.html`: Carga de scripts y librerías necesarias.

---

_Actividad Integradora para la Universidad TENAM._
