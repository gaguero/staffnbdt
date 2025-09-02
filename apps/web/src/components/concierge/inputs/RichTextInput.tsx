import React, { useState, useRef, useEffect } from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';

interface RichTextInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const RichTextInput: React.FC<RichTextInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const currentValue = value || '';

  const toolbar = field.config?.toolbar || [
    'bold', 'italic', 'underline', 'strikethrough',
    'heading1', 'heading2', 'paragraph',
    'bulletList', 'numberedList',
    'link', 'blockquote', 'code',
    'alignLeft', 'alignCenter', 'alignRight',
    'undo', 'redo'
  ];

  useEffect(() => {
    if (editorRef.current && typeof currentValue === 'string') {
      editorRef.current.innerHTML = currentValue;
    }
  }, [currentValue]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };


  const formatBlock = (tagName: string) => {
    execCommand('formatBlock', tagName);
  };

  const insertList = (type: 'ul' | 'ol') => {
    if (type === 'ul') {
      execCommand('insertUnorderedList');
    } else {
      execCommand('insertOrderedList');
    }
  };

  const getToolbarButton = (tool: string) => {
    const buttonClass = "p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors";
    const activeButtonClass = "p-2 text-blue-600 bg-blue-100 rounded";

    const isActive = (command: string) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };

    switch (tool) {
      case 'bold':
        return (
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className={isActive('bold') ? activeButtonClass : buttonClass}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
        );
      case 'italic':
        return (
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className={isActive('italic') ? activeButtonClass : buttonClass}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
        );
      case 'underline':
        return (
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className={isActive('underline') ? activeButtonClass : buttonClass}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
        );
      case 'strikethrough':
        return (
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className={isActive('strikeThrough') ? activeButtonClass : buttonClass}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        );
      case 'heading1':
        return (
          <button
            type="button"
            onClick={() => formatBlock('h1')}
            className={buttonClass}
            title="Heading 1"
          >
            H1
          </button>
        );
      case 'heading2':
        return (
          <button
            type="button"
            onClick={() => formatBlock('h2')}
            className={buttonClass}
            title="Heading 2"
          >
            H2
          </button>
        );
      case 'paragraph':
        return (
          <button
            type="button"
            onClick={() => formatBlock('p')}
            className={buttonClass}
            title="Paragraph"
          >
            P
          </button>
        );
      case 'bulletList':
        return (
          <button
            type="button"
            onClick={() => insertList('ul')}
            className={isActive('insertUnorderedList') ? activeButtonClass : buttonClass}
            title="Bullet List"
          >
            • List
          </button>
        );
      case 'numberedList':
        return (
          <button
            type="button"
            onClick={() => insertList('ol')}
            className={isActive('insertOrderedList') ? activeButtonClass : buttonClass}
            title="Numbered List"
          >
            1. List
          </button>
        );
      case 'link':
        return (
          <button
            type="button"
            onClick={insertLink}
            className={buttonClass}
            title="Insert Link"
          >
            🔗
          </button>
        );
      case 'blockquote':
        return (
          <button
            type="button"
            onClick={() => formatBlock('blockquote')}
            className={buttonClass}
            title="Quote"
          >
            💬
          </button>
        );
      case 'code':
        return (
          <button
            type="button"
            onClick={() => formatBlock('pre')}
            className={buttonClass}
            title="Code Block"
          >
            {'</>'}
          </button>
        );
      case 'alignLeft':
        return (
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className={buttonClass}
            title="Align Left"
          >
            ⬅️
          </button>
        );
      case 'alignCenter':
        return (
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className={buttonClass}
            title="Align Center"
          >
            ↔️
          </button>
        );
      case 'alignRight':
        return (
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className={buttonClass}
            title="Align Right"
          >
            ➡️
          </button>
        );
      case 'undo':
        return (
          <button
            type="button"
            onClick={() => execCommand('undo')}
            className={buttonClass}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
        );
      case 'redo':
        return (
          <button
            type="button"
            onClick={() => execCommand('redo')}
            className={buttonClass}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
        );
      default:
        return null;
    }
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
  };

  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const getCharCount = (html: string) => {
    return html.replace(/<[^>]*>/g, '').length;
  };

  return (
    <div>
      <label className="form-label flex items-center justify-between">
        <span className="flex items-center">
          📝 {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showToolbar ? 'Hide' : 'Show'} toolbar
        </button>
      </label>

      <div className={`border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'opacity-50' : ''}`}>
        {/* Toolbar */}
        {showToolbar && (
          <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
            {toolbar.map((tool, index) => (
              <React.Fragment key={tool}>
                {getToolbarButton(tool)}
                {/* Add separators after certain tool groups */}
                {['strikethrough', 'paragraph', 'numberedList', 'code', 'alignRight'].includes(tool) && 
                 index < toolbar.length - 1 && (
                  <div className="w-px bg-gray-300 mx-1"></div>
                )}
              </React.Fragment>
            ))}
            
            {/* Additional buttons */}
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={clearFormatting}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs"
              title="Clear Formatting"
            >
              Clear
            </button>
          </div>
        )}

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={updateContent}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          className={`p-4 min-h-32 max-h-64 overflow-y-auto focus:outline-none ${
            disabled ? 'cursor-not-allowed bg-gray-50' : 'cursor-text'
          }`}
          style={{
            lineHeight: '1.6',
          }}
          suppressContentEditableWarning
        />

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-2 flex justify-between items-center text-xs text-gray-500 bg-gray-50">
          <div className="flex space-x-4">
            <span>Words: {getWordCount(currentValue)}</span>
            <span>Characters: {getCharCount(currentValue)}</span>
          </div>
          <div className="flex space-x-2">
            {isEditing && <span className="text-green-600">Editing...</span>}
            <span>HTML</span>
          </div>
        </div>
      </div>

      {/* HTML Source View (toggle) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">View HTML Source</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
            {currentValue}
          </pre>
        </details>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Use the toolbar to format your text. Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline).
      </p>
    </div>
  );
};

export default RichTextInput;