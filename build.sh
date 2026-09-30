#!/bin/bash
# Vygeneruje index.html z _template.html s verzí CSS/JS podle obsahu (cache busting)
cd "$(dirname "$0")"
CSSV=$(md5 -q style.css | cut -c1-8); JSV=$(md5 -q main.js | cut -c1-8)
sed -e "s/__CSSV__/$CSSV/" -e "s/__JSV__/$JSV/" _template.html > index.html
echo "css=$CSSV js=$JSV"
