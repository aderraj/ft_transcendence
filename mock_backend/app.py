from flask import Flask, request, render_template_string

app = Flask(__name__)

@app.route('/')
def index():
    return render_template_string('''
<!DOCTYPE html>
<html>
<head>
    <title>Mock App</title>
</head>
<body>
    <h1>Mock Frontend</h1>
    <p>This is a mock frontend behind the WAF.</p>
    <form action="/api/search" method="get">
        <input type="text" name="q" placeholder="Search...">
        <button type="submit">Search</button>
    </form>
    <div id="result"></div>
</body>
</html>
''')

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    # VULNERABLE CODE (for demonstration): reflecting input without sanitization
    # The WAF should block malicious input before it reaches here.
    return f"You searched for: {query}"

@app.route('/api/auth')
def auth():
    return "Auth endpoint reached"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
