#!/bin/bash

# Clean all motion-related attributes from React components
FILE="$1"

# Remove motion props and attributes
sed -i '/animate=.*{/d' "$FILE"
sed -i '/transition=.*{/d' "$FILE"
sed -i '/initial=.*{/d' "$FILE"
sed -i '/exit=.*{/d' "$FILE"
sed -i '/whileHover=.*{/d' "$FILE"
sed -i '/whileTap=.*{/d' "$FILE"

echo "Cleaned motion attributes from $FILE"