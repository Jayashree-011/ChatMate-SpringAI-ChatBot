# ChatMate

ChatMate is a small full-stack AI chatbot. The React/Vite frontend keeps conversations in browser memory for the current page session and sends prior turns to a Spring Boot API. Starting a new chat keeps earlier conversations available in the sidebar; clearing history removes them. The API uses Spring AI's `ChatClient` with Google Gemini 2.5 Flash; it does not store conversations or expose the Gemini key to the browser.

<img width="1917" height="870" alt="Screenshot 2026-10-10 194540" src="https://github.com/user-attachments/assets/96f3927d-c6e7-42c7-9c1e-dc4130436320" />

## Prerequisites

- Java 21
- Maven 3.9 or newer
- Node.js 20.19+ or 22.12+
- A Gemini API key from Google AI Studio

## Run on Windows PowerShell

Open two PowerShell terminals in the project directory.

### 1. Start the backend

```powershell
cd .\chatmate-backend
$env:GEMINI_API_KEY = "your-google-ai-studio-api-key"
$env:FRONTEND_ORIGIN = "http://localhost:5173"
mvn spring-boot:run
```

The API listens on `http://localhost:8080`. Keep the key in the terminal environment; do not put it in frontend files or commit it. `src/main/resources/application.yml` configures `gemini-2.5-flash`. The `.env.example` file documents environment variable names; Spring Boot does not automatically load `.env` files.

### 2. Start the frontend

In the second terminal, from the project root:

```powershell
cd .\chatmate-frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to the backend, so local development uses the native Fetch API without hardcoding the backend URL in frontend code.

To create a production frontend build:

```powershell
cd .\chatmate-frontend
npm run build
```

## API

`POST /api/chat` accepts a current message and previous turns:

```json
{
  "message": "And how does that work?",
  "history": [
    { "role": "USER", "content": "Explain neural networks." },
    { "role": "ASSISTANT", "content": "A neural network is..." }
  ]
}
```

It responds with:

```json
{ "reply": "..." }
```

The history is sent from the browser on each request and reset when the user clears or starts a chat. Requests are capped at 100 history turns and 20,000 characters per message.

## Project map

- `chatmate-frontend/src/App.tsx` — responsive chat layout, in-memory conversation history, composer, welcome suggestions, and interaction states.
- `chatmate-frontend/src/App.css` and `src/index.css` — hand-written dark-theme styling and responsive behavior.
- `chatmate-frontend/src/services/chatApi.ts` — typed native-Fetch client and user-friendly API errors.
- `chatmate-frontend/src/types.ts` — frontend API and message contracts.
- `chatmate-frontend/vite.config.ts` — React setup and local `/api` proxy.
- `chatmate-backend/src/main/java/com/example/chatmate/controller/ChatController.java` — REST endpoint.
- `chatmate-backend/src/main/java/com/example/chatmate/service/ChatService.java` — maps request history into Spring AI messages and calls Gemini.
- `chatmate-backend/src/main/java/com/example/chatmate/dto/` — validated API request, response, and error records.
- `chatmate-backend/src/main/java/com/example/chatmate/controller/GlobalExceptionHandler.java` — consistent validation and server error responses.
- `chatmate-backend/src/main/java/com/example/chatmate/config/WebConfig.java` — local-development CORS policy.
- `chatmate-backend/src/main/resources/application.yml` — server and Gemini model configuration.
- `chatmate-backend/pom.xml` — Java 21, Spring Boot, Spring AI Google GenAI, and validation dependencies.
