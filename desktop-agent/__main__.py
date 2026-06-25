import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from subl_agent.bootstrap import run, run_headless

if __name__ == "__main__":
    if "--headless" in sys.argv:
        run_headless()
    else:
        run()
