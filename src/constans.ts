export const radioOptions = [
    { value: "a", label: "标准" ,prompt:'保持含义，以可靠的方式重写以下文本：',tip:'以可靠的方式重写文本'},
    { value: "b", label: "流利"  ,prompt:'确保文本可读并且没有错误，重写以下文本：',tip:'确保文本可读并且没有错误'},
    { value: "c", label: "正式"  ,prompt:'保持含义,以更精致更专业的方式重写以下文本：',tip:'以更精致更专业的模式呈现文本'},
    { value: "d", label: "通俗"  ,prompt:'保持含义,以大多数人可以理解的方式重写以下文本：',tip:'以大多数人可以理解的模式呈现文本'},
    { value: "e", label: "创造力"  ,prompt:'保持含义,以全新的方式表达以下文本：',tip:'以全新的方式表达文本'},
    { value: "f", label: "扩张" ,prompt:'保持含义,对以下句子添加更多细节和深度以增加句子长度：',tip:'添加更多细节和深度以增加句子长度'},
    { value: "g", label: "缩短"  ,prompt:'对以下句子去掉多余的单词以提供清晰的信息：',tip:'子去掉多余的单词以提供清晰的信息'},
  ];

export const API_URL = 'https://weak-dove-50.deno.dev/v1/chat/completions';
export const API_KEY = "sk-";
