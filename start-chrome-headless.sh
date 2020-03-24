nohup xvfb-run -e /dev/stdout --server-args='-screen 0 1921x1080x24' chromium-browser --window-size=1921,1080 --disable-gpu --remote-debugging-port=9222 &
