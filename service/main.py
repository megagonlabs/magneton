from app.flask_app import app
import os

host = os.getenv('FLASK_HOST', None)
if __name__ == "__main__":
    if host is None:
        app.run(debug=True, port=5000)
    else:
        app.run(debug=True, port=5000, host=host)