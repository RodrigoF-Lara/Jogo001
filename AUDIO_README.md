# 🎵 Configuração de Áudio

## Sons Necessários

Para melhorar a qualidade do jogo, crie uma pasta `audio` e adicione os seguintes arquivos:

### 📁 Estrutura

```
Jogo 001/
├── audio/
│   ├── engine.mp3          (Som de motor do carro)
│   ├── level_up.mp3        (Som de passagem de fase/comemoração)
│   ├── collision.mp3       (Som de colisão)
│   └── score.mp3           (Som de pontuação)
├── index.html
├── style.css
└── script.js
```

## 🔗 Onde Baixar Sons Gratuitos

### Sons de Motor

- **Freesound.org**: https://freesound.org/search/?q=car+engine
- **Zapsplat**: https://www.zapsplat.com/music/engine-sounds/
- **Pixabay**: https://pixabay.com/sound-effects/search/engine/

### Sons de Comemoração/Nível

- **Freesound.org**: https://freesound.org/search/?q=level+up
- **Zapsplat**: https://www.zapsplat.com/music/level+up/
- **YouTube Audio Library**: https://www.youtube.com/audiolibrary

### Recomendações:

- **Formato**: MP3, OGG ou WAV
- **Duração**:
  - engine.mp3: 1-2 segundos
  - level_up.mp3: 2-3 segundos
  - collision.mp3: 1 segundo
  - score.mp3: 0.5 segundos

## 📥 Como Adicionar

1. Crie a pasta `audio` na raiz do projeto
2. Baixe os arquivos de áudio dos sites recomendados
3. Renomeie-os conforme listado acima
4. Coloque-os na pasta `audio`
5. Recarregue o jogo no navegador

O jogo detectará automaticamente se os arquivos existem e os usará!

## 💡 Alternativa: Usar sons online

Se preferir, pode linkar sons diretamente de URLs online (veja comentários no script.js)
