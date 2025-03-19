from flask import Flask, request, jsonify

app = Flask(__name__)

# Простая база данных (для примера)
users = {}

# Регистрация
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username in users:
        return jsonify({"message": "Пользователь уже существует"}), 400

    users[username] = password
    return jsonify({"message": "Регистрация успешна"}), 201

# Авторизация
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if users.get(username) == password:
        return jsonify({"message": "Авторизация успешна"}), 200
    return jsonify({"message": "Неверное имя пользователя или пароль"}), 401

if __name__ == '__main__':
    app.run(debug=True)
