rm -fr .assetpack public
npm run build
rsync -av ./dist/* /home/spacegame/games/bubble-trouble/
rsync -av ./public/assets/ /home/spacegame/games/bubble-trouble/assets/
