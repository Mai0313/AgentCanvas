<center>

# Agent Canvas

[![React](https://img.shields.io/badge/-React_19.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/-TypeScript_5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![OpenAI API](https://img.shields.io/badge/-OpenAI_API-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Azure OpenAI](https://img.shields.io/badge/-Azure_OpenAI-0078D4?logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/services/openai/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/yourusername/agent-canvas/pulls)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</center>

An intelligent conversational interface supporting multiple modes of interaction with AI models.

## Demo
[![Watch on YouTube](https://img.youtube.com/vi/-7xr-apjWSY/hqdefault.jpg)](https://youtu.be/-7xr-apjWSY)

## Homepage
![Agent Canvas UI](/public/ui.png)

## Canvas Mode
![Canvas Mode](/public/canvas.png)
- This mode supports interactive editing of generated code and text.

## Graph Mode
![Image Mode](/public/graph.png)

## Project Description

Agent Canvas is an interactive AI chat application built with modern web technologies:

- Developed using `Vite` and `TypeScript` with `yarn` for package management
- Features a flexible interface for text, code, and image generation
- Supports multiple conversation modes and interactive editing capabilities
- Preserves state in URL for seamless session continuity
- Supports both Dark Mode and Light Mode

## Technologies Used

- [Vite](https://vitejs.dev/guide/)
- [HeroUI](https://heroui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org)
- [Framer Motion](https://www.framer.com/motion)

## Supporting Features

### Multi-Modal Conversation
- **Canvas Mode** (`currentMode === "canvas"`)
  - Expands `MarkdownCanvas` and `ChatBox` to fullscreen mode
  - Users can return to normal view by clicking the `X` (Close) button
  - Chat process splits into two separate `chatCompletion` calls:
    - First completion: Generates code response in a code block and streams it to `MarkdownCanvas`
    - Second completion: Uses both the user's question and generated code to create descriptive text
    - Both responses render simultaneously in the `ChatBox`, preserving standard chat behavior
  
- **Image Mode** (`currentMode === "image"`)
  - Uses `generateImageAndText` to create both image and corresponding text
  - Generated images and text are rendered together in the `ChatBox`
  - Process: First generates the image, then uses the resulting `imageUrl` in a `chatCompletion` to generate descriptive text
  
- **Chat Mode** (standard)
  - Conducts normal question-answer dialogue

### Interactive UI Elements
- **Resizable Interface**: `ResizeBox` between `MarkdownCanvas` and `ChatBox` allows users to adjust panel sizes
- **Text Selection**: 
  - `ContextMenu` appears when text is selected
  - "Ask GPT" option transfers selected text to `ChatBox` for further questions
- **Message Actions**: Each AI response includes action buttons:
  - **Copy**: Copies response content to clipboard
  - **Edit**: Transforms response into editable state with a "Send" button to submit changes
  - **Delete**: Removes the specific response
  - **Regenerate**: Deletes current response and generates a new one

### Advanced Input Methods

- **Image Input**: Users can paste images using Ctrl+V, which are then incorporated into chat completions
- **Message Manipulation**: Edit and copy functionality for message management
- **Smooth Animations**: Fluid transition from homepage to conversation interface

## TODO Features

- [ ] Chat History: Implement a feature to view past conversations
- [ ] User Authentication: Allow users to save their chat history and settings
- [ ] RAG (Retrieval-Augmented Generation): Integrate a system to fetch relevant documents or data to enhance responses

## How to Use

To clone the project, run the following command:

```bash
git clone https://github.com/Mai0313/AgentCanvas.git
```

### Install dependencies

You can use one of `npm`, `yarn`, `pnpm`, or `bun`. Example using `yarn`:

```bash
yarn install
```

### Run the development server

```bash
yarn dev
```

## License

Licensed under the [MIT license](https://github.com/Mai0313/AgentCanvas/blob/master/LICENSE).
