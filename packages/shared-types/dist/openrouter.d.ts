export interface OpenRouterMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}
export interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}
export interface OpenRouterResponse {
    choices: Array<{
        message: {
            content?: string;
            tool_calls?: ToolCall[];
        };
    }>;
}
export interface Tool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}
