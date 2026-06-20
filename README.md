# Marina's Wardrobe

Armario digital para explorar y combinar prendas por temporada.

## Estructura

```
marinas-wardrobe
├── index.html              # Aplicación principal
├── app.js                  # Lógica de carruseles y temporadas
├── styles.css              # Estilos
├── assets
│   ├── fondo.png           # Imagen de fondo
│   ├── summer              # Prendas de verano
│   ├── winter              # Prendas de invierno
│   ├── bolsos              # Bolsos (compartido)
│   └── accesorios          # Accesorios (compartido)
└── data
    └── items.manifest.json # Lista de imágenes por categoría
```

## Uso local

```bash
npm run serve
```

Abre `http://localhost:8000` en el navegador.

## App iOS

Este proyecto usa Capacitor para empaquetar la web como app nativa iOS.

### Requisitos

- Node.js y npm
- Xcode instalado en macOS

### Comandos

```bash
npm install
npm run build
npm run ios:sync
npm run ios:open
```

`npm run build` copia la web y sus assets a `www/`, que es la carpeta que Capacitor sincroniza con Xcode.

Para abrir el proyecto directamente en Xcode:

```bash
npm run ios:open
```

Desde Xcode puedes elegir un simulador o un iPhone conectado y ejecutar la app.
