# Map research notes

Natural Earth 官方條款說明，其 raster/vector map data 屬於 public domain，可修改、電子散布與商業使用；可選擇標示「Made with Natural Earth」。來源：https://www.naturalearthdata.com/about/terms-of-use/

Wikimedia Commons 的 BlankMap-World.svg 頁面標示該檔案為 public domain，並提供 SVG 原始檔與不同尺寸下載。來源：https://commons.wikimedia.org/wiki/File:BlankMap-World.svg

Expo 官方 Maps 文件明確說明 Expo Maps 目前不在 Expo Go 中，需要 development build；因此本專案的 Expo Go 路徑不能依賴 expo-maps 或 react-native-maps。來源：https://docs.expo.dev/versions/latest/sdk/maps/

實作決策：使用可嵌入專案的本地世界地圖 SVG/PNG 資產，搭配 React Native Gesture Handler 或 PanResponder 做拖曳與縮放，保留 Expo Go 相容性；博物館標記以經緯度轉換為投影座標。
