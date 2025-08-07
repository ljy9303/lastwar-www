#!/bin/bash

# Comprehensive script to remove Framer Motion from AIResultEditor.tsx

FILE="/home/dencomm/lastwar/lastwar-www/app/users/ai-add/components/AIResultEditor.tsx"

echo "Starting comprehensive Framer Motion cleanup for AIResultEditor.tsx..."

# Step 1: Replace motion.div with div
sed -i 's/motion\.div/div/g' "$FILE"

# Step 2: Remove motion-specific props (one line at a time to avoid breaking JSX)
sed -i '/initial={/d' "$FILE"
sed -i '/animate={/d' "$FILE"
sed -i '/transition={/d' "$FILE"
sed -i '/whileHover={/d' "$FILE"
sed -i '/whileTap={/d' "$FILE"
sed -i '/exit={/d' "$FILE"

# Step 3: Replace AnimatePresence with React fragment
sed -i 's/AnimatePresence>/>/g' "$FILE"

echo "Completed Framer Motion cleanup for AIResultEditor.tsx"