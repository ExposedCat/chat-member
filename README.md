# Telegram AI Chat Member | Laylo v2

This project is a second experiment after
[tg-local-llm](https://github.com/exposedcat/tg-local-llm) aimed at extending AI
assistant possibilities and improving response quality by exposing messenger API
to the agent rather than performing a complex response parsing and processing
manually.

## Tools

- `send_message(text)` sends a message in the chat
- `search_messages(query, dateMin?, dateMax?)` performs a semantic search in the
  chat
- `finish()` signal to stop requesting any further agent actions

## Deep Dive

### Message Search

**Message search** is meant to let agent efficiently find messages to handle
user requests such as search itself or selective chat summaries. Under the hood,
message search is implemented in a simple flow:

- Create an embedding for each message in a chat and store it in a
  [Qdrant](https://qdrant.tech/) database
- Provide agent with a tool to perform a vector search on a database by given
  query. Internally, each request is scoped to a chat ID. Agent is allowed (but
  not required to) set hard filters on message payloads, such as filtering
  messages by date which can let it process requests such as summary of last 2
  hours in the chat.

## Tech

- Written in TypeScript with [grammY](https://grammy.dev) Bot API framework
- Using MongoDB for persistence
- Using
  [onnxruntime-node](https://onnxruntime.ai/docs/get-started/with-javascript/node.html)
  and
  [tokenizers](https://github.com/huggingface/tokenizers/tree/main/bindings/node)
  for tokenization and embedding model invocation
- Using [Qdrant](https://qdrant.tech/) to store embeddings
- Using [Ollama](https://ollama.com/) for AI inference

## Hardware & Models

- Developed and tested on RX 6800 XT with 16G VRAM
- Tested with [Qwen3 14B](https://ollama.com/library/qwen3:14b) as a main model
- Tested with
  [Multilingual E5 large instruct](https://huggingface.co/intfloat/multilingual-e5-large-instruct)
  as embedding model
