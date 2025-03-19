import React, { useState, useEffect } from "react";
import Register from "./Register";
import Login from "./Login";

// Контекст для управления темой
const ThemeContext = React.createContext();

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [chats, setChats] = useState([]);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Функция для загрузки чатов
  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        throw new Error("Не удалось загрузить чаты");
      }
      const data = await response.json();
      setChats(data);
    } catch (err) {
      console.error("Ошибка загрузки чатов:", err);
      setError(err.message);
    }
  };

  // Загружаем чаты при монтировании компонента
  useEffect(() => {
    fetchChats();
  }, []);

  // Переключение темы
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div className={`h-screen flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <div className={`w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Чатико</h1>
            <input
              type="text"
              placeholder="🔍 Поиск"
              className={`border p-2 rounded-md w-2/3 ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
            />
          </div>

          {isLogin ? (
            <Login />
          ) : (
            <Register />
          )}

          <div>
            {error ? (
              <p className="text-center text-red-500 p-4">{error}</p>
            ) : chats.length > 0 ? (
              chats.map((chat) => (
                <div key={chat._id} className={`flex items-center p-4 border-b hover:bg-gray-100 cursor-pointer ${isDarkMode ? "text-white" : "text-black"}`}>
                  <img src={chat.avatar || "https://via.placeholder.com/50"} alt="avatar" className="w-12 h-12 rounded-full" />
                  <div className="ml-4 flex-1">
                    <h2 className="text-lg font-semibold">{chat.name}</h2>
                    <p className="text-gray-600">{chat.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{chat.time}</p>
                    {chat.unread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{chat.unread}</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 p-4">Чатов пока нет</p>
            )}
          </div>

          <button
            className="fixed bottom-5 right-5 bg-blue-500 text-white p-4 rounded-full shadow-lg"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Регистрация" : "Вход"}
          </button>

          <button
            className="fixed top-5 right-5 bg-yellow-500 text-white p-4 rounded-full shadow-lg"
            onClick={toggleTheme}
          >
            {isDarkMode ? "Светлая тема" : "Тёмная тема"}
          </button>
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
