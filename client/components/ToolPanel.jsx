import { useEffect, useState } from "react";

const functionDescriptions = `
Call this function when a user asks for a color palette.
Call pixel_art function when user asks for pixel art or simple drawings.
Call show_arrow function when user asks to show or display an arrow in any direction.
Call find_similar_people function when user wants to play a game finding people matching specific criteria.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_color_palette",
        description: "Generate and display a color palette based on a theme",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the theme for the color scheme.",
            },
            colors: {
              type: "array",
              description: "Array of five hex color codes based on the theme.",
              items: {
                type: "string",
                description: "Hex color code",
              },
            },
          },
          required: ["theme", "colors"],
        },
      },
      {
        type: "function",
        name: "create_pixel_art",
        description: "Generate and display simple pixel art drawings",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            description: {
              type: "string",
              description: "Description of what the pixel art represents",
            },
            pixels: {
              type: "array",
              description: "2D array of hex color codes representing pixels (8x8 grid)",
              items: {
                type: "array",
                items: {
                  type: "string",
                  description: "Hex color code for each pixel",
                },
              },
            },
            size: {
              type: "integer",
              description: "Size of the pixel grid (8 for 8x8)",
              enum: [8],
            },
          },
          required: ["description", "pixels", "size"],
        },
      },
      {
        type: "function",
        name: "show_arrow",
        description: "Display an arrow pointing in the specified direction",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            direction: {
              type: "string",
              enum: ["up", "down", "left", "right"],
              description: "The direction the arrow should point",
            }
          },
          required: ["direction"],
        },
      },
      {
        type: "function",
        name: "find_similar_people",
        description: "Start a game where users need to find people matching a specific criteria",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            query: {
              type: "string",
              description: "The search criteria or category of people to find (e.g., 'AI enthusiasts', 'IIT alumni')",
            }
          },
          required: ["query"],
        },
      }
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { theme, colors } = JSON.parse(functionCallOutput.arguments);

  const colorBoxes = colors.map((color) => (
    <div
      key={color}
      className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
      style={{ backgroundColor: color }}
    >
      <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
        {color}
      </p>
    </div>
  ));

  return (
    <div className="flex flex-col gap-2">
      <p>Theme: {theme}</p>
      {colorBoxes}
      <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
        {JSON.stringify(functionCallOutput, null, 2)}
      </pre>
    </div>
  );
}

function PixelArtOutput({ functionCallOutput }) {
  try {
    if (!functionCallOutput?.arguments) {
      return <div>Invalid pixel art data</div>;
    }

    const { description, pixels, size } = JSON.parse(functionCallOutput.arguments);
    
    if (!Array.isArray(pixels) || !pixels.length) {
      return <div>Invalid pixel data format</div>;
    }

    const pixelSize = "32px"; // Size of each pixel
    
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold">{description}</p>
        
        <div className="flex justify-center w-full">
          <div 
            className="grid gap-[1px] bg-gray-800 p-2 rounded-lg shadow-lg"
            style={{ 
              gridTemplateColumns: `repeat(${size}, ${pixelSize})`,
              width: 'fit-content'
            }}
          >
            {pixels.flat().map((color, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: color,
                  width: pixelSize,
                  height: pixelSize,
                }}
                className="transition-colors duration-200 hover:opacity-90"
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Color palette used */}
        <div className="mt-2 bg-gray-100 rounded-md p-4">
          <h3 className="text-sm font-semibold mb-2">Color Palette Used:</h3>
          <div className="flex flex-wrap gap-2">
            {[...new Set(pixels.flat())].map((color) => (
              <div
                key={color}
                className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm"
              >
                <div
                  className="w-6 h-6 rounded-md border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Raw data display */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Show raw data
          </summary>
          <pre className="mt-2 bg-gray-100 rounded-md p-2 overflow-x-auto">
            {JSON.stringify(functionCallOutput, null, 2)}
          </pre>
        </details>
      </div>
    );
  } catch (error) {
    console.error("Error parsing pixel art data:", error);
    return <div>Error displaying pixel art</div>;
  }
}

function ArrowOutput({ functionCallOutput }) {
  try {
    if (!functionCallOutput?.arguments) {
      return <div>Invalid arrow data</div>;
    }

    const { direction } = JSON.parse(functionCallOutput.arguments);
    
    const arrowSymbols = {
      up: '↑',
      down: '↓',
      left: '←',
      right: '→'
    };

    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-lg font-semibold">Direction: {direction}</p>
        <div className="text-8xl font-bold text-orange-400">
          {arrowSymbols[direction]}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error parsing arrow data:", error);
    return <div>Error displaying arrow</div>;
  }
}

function FindSimilarPeopleGame({ functionCallOutput, sendClientEvent }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [isDone, setIsDone] = useState(false);
  const [embedding, setEmbedding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { query } = JSON.parse(functionCallOutput.arguments);

  // Start both the embedding request and timer immediately
  useEffect(() => {
    // Make direct request to OpenAI embeddings API with hardcoded key
    fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log("OpenAI Embedding Response:", data);
        if (data.data && data.data[0] && data.data[0].embedding) {
          setEmbedding(data.data[0].embedding);
        } else {
          throw new Error("Invalid embedding response structure");
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error getting embedding:', error);
        setIsLoading(false);
      });
  }, [query]);

  // Timer runs independently
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isDone) {
      setIsDone(true);
      sendClientEvent({
        type: "response.create",
        response: {
          instructions: "Ask if they found someone matching the criteria",
        },
      });
    }
  }, [timeLeft, isDone, sendClientEvent]);

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="text-xl font-semibold text-gray-700 text-center">
        Find someone who is:
        <div className="text-orange-500 font-bold mt-2">
          {query}
        </div>
      </div>
      
      <div className="text-6xl font-bold text-orange-400 mt-4">
        {isDone ? "Time's Up!" : timeLeft}
      </div>
      
      {/* Only show embedding after timer is done */}
      {isDone && (
        <div className="w-full mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Query Embedding:</h3>
          {isLoading ? (
            <div className="text-gray-500">Still generating embedding...</div>
          ) : embedding ? (
            <div className="text-xs font-mono overflow-x-auto">
              <div className="flex flex-wrap gap-1">
                {embedding.slice(0, 20).map((value, i) => (
                  <span key={i} className="bg-white px-2 py-1 rounded">
                    {value.toFixed(4)}
                  </span>
                ))}
                <span className="px-2 py-1">...</span>
                <div className="w-full mt-2 text-gray-500 text-right">
                  {embedding.length} dimensions
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-500">Failed to generate embedding</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);
  const [activeFunction, setActiveFunction] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (isSessionActive && !functionAdded && firstEvent.type === "session.created") {
      setTimeout(() => {
        sendClientEvent(sessionUpdate);
        setFunctionAdded(true);
      }, 1000);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call") {
          setFunctionCallOutput(output);
          setActiveFunction(output.name);
        }
      });
    }
  }, [events, isSessionActive]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
      setActiveFunction(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">AI Creative Tools</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <>
              <div className="text-xs text-gray-500 mb-2">
                Active Function: {activeFunction}
              </div>
              {activeFunction === "create_pixel_art" ? (
                <PixelArtOutput functionCallOutput={functionCallOutput} />
              ) : activeFunction === "show_arrow" ? (
                <ArrowOutput functionCallOutput={functionCallOutput} />
              ) : activeFunction === "find_similar_people" ? (
                <FindSimilarPeopleGame 
                  functionCallOutput={functionCallOutput} 
                  sendClientEvent={sendClientEvent}
                />
              ) : (
                <FunctionCallOutput functionCallOutput={functionCallOutput} />
              )}
            </>
          ) : (
            <p>Ask for a color palette, pixel art, direction arrow, or find similar people...</p>
          )
        ) : (
          <p>Start the session to use these tools...</p>
        )}
      </div>
    </section>
  );
}
