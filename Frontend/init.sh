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

# Check if $BACKEND_URL string is present in the environment variables
env_has_backend_url=false
while IFS='=' read -r name value; do
  if [ "$name" = "BACKEND_URL" ]; then
    env_has_backend_url=true
    break
  fi
done < <(env)

if ! $env_has_backend_url; then
  echo "BACKEND_URL is not found in environment variables."
  exit 1
fi

# Use find to locate all files in the specified directory and its subdirectories
# Use sed to perform the replacement in place (-i) for each file found
find "$DIRECTORY" -type f -exec sed -i "s|http://localhost:5400|$BACKEND_URL|g" {} +

echo $BACKEND_URL

# Check if $BACKEND_URL string is hardcoded in any file after replacement
if grep -q '\$BACKEND_URL' "$DIRECTORY"; then
  echo "\$BACKEND_URL is still present in some files after replacement."
else
  echo "Replacement complete. \$BACKEND_URL is not found in any files."
fi
