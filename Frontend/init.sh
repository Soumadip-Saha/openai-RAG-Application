# Check if the directory is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <directory>"
  exit 1
fi

# Assign the first argument as the directory
DIRECTORY=$1

# Check if BACKEND_URL environment variable is set
if [ -z "$BACKEND_URL" ]; then
  echo "BACKEND_URL environment variable is not set."
  exit 1
fi

# Use find to locate all files in the specified directory and its subdirectories
# Use sed to perform the replacement in place (-i) for each file found
find "$DIRECTORY" -type f -exec sed -i "s|http://localhost:5400|$BACKEND_URL|g" {} +

echo $BACKEND_URL

# Check if 'http://localhost:5400' string is still hardcoded in any file after replacement
if grep -q 'http://localhost:5400' "$DIRECTORY"/*; then
  echo "'http://localhost:5400' is still present in some files after replacement."
else
  echo "Replacement complete. 'http://localhost:5400' is not found in any files."
fi
