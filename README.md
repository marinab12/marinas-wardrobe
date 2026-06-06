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
python3 -m http.server 8000
```

Abre `http://localhost:8000` en el navegador.
