import React, { useState, useCallback, useRef } from 'react';
// @ts-expect-error No types for mammoth available
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { processDocument, convertContent } from '../services/geminiService';
import { exportContent, copyToClipboard } from '../utils/helpers';
import { ActionButton } from './common/ActionButton';
import { LoadingSpinner } from './common/LoadingSpinner';
import { UploadIcon, BrainIcon, ExportIcon, CsvIcon, CopyIcon, MarkdownIcon, FileTextIcon, ChevronDownIcon, PresentationIcon, DocxIcon, PdfIcon, ZapIcon } from './icons/Icons';

// Set worker source for pdf.js from a CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.js`;

type ExportFormat = 'html' | 'csv' | 'md' | 'txt' | 'pptx' | 'docx' | 'pdf';

export const DocumentProcessor: React.FC = () => {
    const [documentContent, setDocumentContent] = useState('');
    const [userPrompt, setUserPrompt] = useState('');
    const [processedContent, setProcessedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isFileReading, setIsFileReading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('document');
    const [copySuccess, setCopySuccess] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setDocumentContent('');
        setFileName(file.name);
        setIsFileReading(true);
        setError(null);

        const reader = new FileReader();
        
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'docx') {
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    setDocumentContent(result.value);
                } catch (err) {
                    console.error("DOCX parsing error:", err);
                    setError('Failed to extract text from DOCX file.');
                } finally {
                    setIsFileReading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'pdf') {
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                        fullText += pageText + '\n\n';
                    }
                    setDocumentContent(fullText.trim());
                } catch (err) {
                    console.error("PDF parsing error:", err);
                    setError('Failed to extract text from PDF file. It might be an image-only PDF or corrupted.');
                } finally {
                    setIsFileReading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'pptx') {
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));

                    const extractTextFromXml = (xmlString: string): string => {
                        const pRegex = /<a:p>(.*?)<\/a:p>/g;
                        const tRegex = /<a:t.*?>(.*?)<\/a:t>/g;
                        let slideText = '';
                        let pMatch;
                        while ((pMatch = pRegex.exec(xmlString)) !== null) {
                            let pText = '';
                            let tMatch;
                            const pContent = pMatch[1];
                            const tRegexForP = new RegExp(tRegex.source, 'g');
                            while ((tMatch = tRegexForP.exec(pContent)) !== null) {
                                pText += tMatch[1];
                            }
                            if (pText.trim()) {
                                slideText += pText.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') + '\n';
                            }
                        }
                        return slideText + '\n';
                    };
                    
                    slideFiles.sort((a, b) => {
                        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
                        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
                        return numA - numB;
                    });
                    
                    let fullText = '';
                    for (const slideFile of slideFiles) {
                        const xmlContent = await zip.file(slideFile)!.async('string');
                        fullText += extractTextFromXml(xmlContent);
                    }
                    
                    setDocumentContent(fullText.trim());
                } catch (err) {
                    console.error("PPTX parsing error:", err);
                    setError('Failed to extract text from PPTX file.');
                } finally {
                    setIsFileReading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (['txt', 'md', 'html', 'csv'].includes(fileExtension || '')) {
             reader.onload = (e) => {
                setDocumentContent(e.target?.result as string);
                setIsFileReading(false);
            };
            reader.readAsText(file);
        } else {
            setError(`Unsupported file type: .${fileExtension}`);
            setIsFileReading(false);
        }
    }, []);


    const handleProcess = async () => {
        if (!documentContent.trim() || !userPrompt.trim()) {
            setError('Please provide both the document content and instructions.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setProcessedContent('');
        setCopySuccess('');

        try {
            const result = await processDocument(documentContent, userPrompt);
            setProcessedContent(result);
        } catch (e) {
            console.error(e);
            setError('An error occurred while processing the document.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!processedContent) return;
        try {
            const blob = new Blob([processedContent], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            navigator.clipboard.write([clipboardItem]).then(() => {
                setCopySuccess('Copied rich content!');
                setTimeout(() => setCopySuccess(''), 2000);
            }, () => {
                 handlePlainTextCopy();
            });
        } catch (err) {
            console.error('Failed to copy rich text, falling back to plain text: ', err);
            handlePlainTextCopy();
        }
    };

    const handlePlainTextCopy = () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;
        const textToCopy = tempDiv.textContent || tempDiv.innerText || "";
        copyToClipboard(textToCopy)
            .then(() => {
                setCopySuccess('Copied as plain text.');
                 setTimeout(() => setCopySuccess(''), 2000);
            })
            .catch(copyErr => {
                console.error('Failed to copy plain text: ', copyErr);
                setCopySuccess('Failed to copy.');
            });
    }

    const handleExport = async (format: ExportFormat) => {
        if (!processedContent) return;
        setIsExporting(true);
        setError(null);
        setShowExportMenu(false);

        const baseFileName = fileName.split('.').slice(0, -1).join('.') || 'document';

        try {
            switch(format) {
                case 'html':
                    exportContent(processedContent, `${baseFileName}_modified.html`, 'text/html;charset=utf-8;');
                    break;
                case 'csv':
                    const csvContent = await convertContent(processedContent, 'csv');
                    exportContent(csvContent, `${baseFileName}_modified.csv`, 'text/csv;charset=utf-8;');
                    break;
                case 'md':
                    const mdContent = await convertContent(processedContent, 'markdown');
                    exportContent(mdContent, `${baseFileName}_modified.md`, 'text/markdown;charset=utf-8;');
                    break;
                case 'txt':
                    const txtContent = await convertContent(processedContent, 'plaintext');
                    exportContent(txtContent, `${baseFileName}_modified.txt`, 'text/plain;charset=utf-8;');
                    break;
                case 'pptx':
                    const PptxGenJS = (await import('pptxgenjs')).default;
                    const pres = new PptxGenJS();
                    pres.layout = 'LAYOUT_WIDE';

                    const container = document.createElement('div');
                    container.innerHTML = processedContent;

                    const createPptxRuns = (node: Node): { text: string; options: any }[] => {
                        const runs: { text: string; options: any }[] = [];
                        const traverse = (currentNode: Node, options: any = {}) => {
                            if (currentNode.nodeType === Node.TEXT_NODE) {
                                if (currentNode.textContent) {
                                    runs.push({ text: currentNode.textContent, options });
                                }
                                return;
                            }
                            if (currentNode.nodeType !== Node.ELEMENT_NODE) return;
                    
                            const element = currentNode as HTMLElement;
                            let newOptions = { ...options };
                            if (element.tagName === 'STRONG' || element.tagName === 'B') newOptions.bold = true;
                            if (element.tagName === 'EM' || element.tagName === 'I') newOptions.italic = true;
                            if (element.tagName === 'U') newOptions.underline = true;
                    
                            if (element.tagName === 'BR') {
                                runs.push({ text: '\n', options: {} });
                            } else {
                                Array.from(currentNode.childNodes).forEach(child => traverse(child, newOptions));
                            }
                        };
                        traverse(node, {});
                        return runs;
                    };


                    let currentSlide: any | null = null;
                    let y = 1.2; 
                    const slideMargin = 0.5;
                    const slideWidth = '90%';

                    const newSlide = (title?: string) => {
                        currentSlide = pres.addSlide();
                        if (title) {
                            currentSlide.addText(title, { x: slideMargin, y: 0.25, w: slideWidth, h: 0.75, fontSize: 32, bold: true });
                            y = 1.2;
                        } else {
                            y = 0.5;
                        }
                    };

                    Array.from(container.children).forEach(node => {
                        const el = node as HTMLElement;
                        if (!el.textContent?.trim()) return;

                        if (el.tagName === 'H1' || el.tagName === 'H2') {
                            newSlide(el.textContent.trim());
                            return;
                        }

                        if (!currentSlide) newSlide();
                        if (y > 6.5) newSlide();
                        
                        const elRuns = createPptxRuns(el);
                        if (elRuns.length === 0) return;

                        if (el.tagName === 'P' || el.tagName.match(/^H[3-6]$/)) {
                            const isHeading = !!el.tagName.match(/^H[3-6]$/);
                            currentSlide.addText(elRuns, { x: slideMargin, y, w: slideWidth, fontSize: isHeading ? 18 : 14, bold: isHeading });
                            y += 0.4;
                        } else if (el.tagName === 'UL' || el.tagName === 'OL') {
                            const listItems = Array.from(el.querySelectorAll('li'));
                            const finalRuns: any[] = [];
                            listItems.forEach((li, index) => {
                                if (li.textContent?.trim()) {
                                    const liRuns = createPptxRuns(li);
                                    if (liRuns.length > 0) {
                                        if (index < listItems.length - 1) {
                                            liRuns.push({ text: '\n', options: {} });
                                        }
                                        finalRuns.push(...liRuns);
                                    }
                                }
                            });
                            if (finalRuns.length > 0) {
                                currentSlide.addText(finalRuns, { x: slideMargin, y, w: slideWidth, fontSize: 14, bullet: true });
                                y += (finalRuns.filter(r => r.text === '\n').length + 1) * 0.3;
                            }
                        } else if (el.tagName === 'TABLE') {
                            const rows: any[] = [];
                             el.querySelectorAll('tr').forEach(tr => {
                                const rowCells: any[] = [];
                                tr.querySelectorAll('th, td').forEach(cell => {
                                    rowCells.push({ text: createPptxRuns(cell), options: { bold: cell.tagName === 'TH' } });
                                });
                                rows.push(rowCells);
                            });
                            if (rows.length > 0) {
                                currentSlide.addTable(rows, { x: slideMargin, y, w: slideWidth });
                                y += rows.length * 0.4;
                            }
                        }
                    });

                    pres.writeFile({ fileName: `${baseFileName}_modified.pptx` });
                    break;
                case 'docx':
                    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = await import('docx');

                    type ParagraphInstance = InstanceType<typeof Paragraph>;
                    type TableInstance = InstanceType<typeof Table>;
                    type TableRowInstance = InstanceType<typeof TableRow>;
                    type TableCellInstance = InstanceType<typeof TableCell>;

                    const createRunsFromNode = (node: Node, styles: { bold?: boolean; italics?: boolean; } = {}): any[] => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            if (!node.textContent) return [];
                            return [new TextRun({ text: node.textContent, ...styles })];
                        }
                        if (node.nodeType !== Node.ELEMENT_NODE) return [];

                        const element = node as HTMLElement;
                        if (element.tagName === 'BR') return [new TextRun({ break: 1 })];

                        let newStyles = { ...styles };
                        if (element.tagName === 'STRONG' || element.tagName === 'B') newStyles.bold = true;
                        if (element.tagName === 'EM' || element.tagName === 'I') newStyles.italics = true;
                        
                        let runs: any[] = [];
                        Array.from(element.childNodes).forEach(child => {
                            runs = runs.concat(createRunsFromNode(child, newStyles));
                        });
                        return runs;
                    };
                    
                    const docContainer = document.createElement('div');
                    docContainer.innerHTML = processedContent;
                    const docxChildren: (ParagraphInstance | TableInstance)[] = [];

                    Array.from(docContainer.children).forEach(node => {
                        const el = node as HTMLElement;
                        if (!el.textContent?.trim()) return;

                        if (el.tagName.match(/^H[1-6]$/)) {
                            const level = parseInt(el.tagName.substring(1), 10);
                            let headingLevel;
                            switch (level) {
                                case 1: headingLevel = HeadingLevel.HEADING_1; break;
                                case 2: headingLevel = HeadingLevel.HEADING_2; break;
                                case 3: headingLevel = HeadingLevel.HEADING_3; break;
                                default: headingLevel = HeadingLevel.HEADING_4; break;
                            }
                            docxChildren.push(new Paragraph({ children: createRunsFromNode(el), heading: headingLevel }));
                        } else if (el.tagName === 'P') {
                            docxChildren.push(new Paragraph({ children: createRunsFromNode(el) }));
                        } else if (el.tagName === 'UL' || el.tagName === 'OL') {
                            Array.from(el.querySelectorAll('li')).forEach(li => {
                                if (li.textContent?.trim()) {
                                    docxChildren.push(new Paragraph({ children: createRunsFromNode(li), bullet: { level: 0 } }));
                                }
                            });
                        } else if (el.tagName === 'TABLE') {
                            const rows: TableRowInstance[] = [];
                            el.querySelectorAll('tr').forEach(tr => {
                                const cells: TableCellInstance[] = [];
                                tr.querySelectorAll('th, td').forEach(cell => {
                                    const cellParagraphs = [new Paragraph({ children: createRunsFromNode(cell) })];
                                    cells.push(new TableCell({ children: cellParagraphs }));
                                });
                                rows.push(new TableRow({ children: cells }));
                            });
                            if(rows.length > 0) docxChildren.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
                        } else if (el.tagName === 'PRE' || el.tagName === 'CODE') {
                            docxChildren.push(new Paragraph({ children: [new TextRun({ text: el.textContent || '', font: 'Courier New' })] }));
                        }
                    });

                    const doc = new Document({ sections: [{ children: docxChildren }] });
                    const blob = await Packer.toBlob(doc);
                    exportContent(blob, `${baseFileName}_modified.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                    break;
                case 'pdf':
                    const { default: jsPDF } = await import('jspdf');
                    const { default: html2canvas } = await import('html2canvas');

                    const outputElement = outputRef.current;
                    if (!outputElement) {
                        throw new Error("Could not find element to export to PDF");
                    }

                    const canvas = await html2canvas(outputElement, {
                        scale: 2, 
                        useCORS: true,
                        backgroundColor: null,
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;

                    // A4 size
                    const pdf = new jsPDF({
                        orientation: 'p',
                        unit: 'pt',
                        format: 'a4'
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    const ratio = imgWidth / imgHeight;
                    const scaledHeight = pdfWidth / ratio;
                    
                    let position = 0;
                    let heightLeft = scaledHeight;

                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight, undefined, 'FAST');
                    heightLeft -= pdfHeight;

                    while (heightLeft > 0) {
                        position -= pdfHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight, undefined, 'FAST');
                        heightLeft -= pdfHeight;
                    }

                    pdf.save(`${baseFileName}_modified.pdf`);
                    break;
            }
        } catch (e) {
             console.error(e);
             setError(`Failed to convert to ${format.toUpperCase()}.`);
        } finally {
            setIsExporting(false);
        }
    };

    const quickActions = [
        "Summarize this document.",
        "Fix grammar and improve flow.",
        "Translate to Spanish.",
        "Format as a clean data table."
    ];

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-in pb-10">
            {/* Header */}
            <div className="text-center sm:text-left mb-2 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-400 mb-2">Document Processor</h2>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Upload, edit, and instantly reformat text-based documents with AI.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* --- Input Column (Left) --- */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 p-5 sm:p-7">
                        
                        {/* 1. Upload Section */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">1. Input Target</h3>
                            <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-teal-400 dark:hover:border-teal-600 transition-all shadow-sm group">
                                {isFileReading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <LoadingSpinner className="h-8 w-8 text-teal-500" />
                                        <span className="mt-3 block text-sm font-semibold text-gray-600 dark:text-gray-300">Extracting Text...</span>
                                    </div>
                                ) : (
                                    <>
                                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-teal-500 transition-colors" />
                                        <span className="mt-3 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {fileName !== 'document' ? <span className="text-teal-600 dark:text-teal-400">{fileName}</span> : 'Tap to Upload File'}
                                        </span>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest font-medium">TXT, MD, CSV, DOCX, PDF, PPTX</p>
                                    </>
                                )}
                                <input type="file" onChange={handleFileChange} className="hidden" accept=".txt,.md,.html,.csv,.docx,.pdf,.pptx" disabled={isFileReading} />
                            </label>

                            <div className="relative mt-4">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white dark:bg-gray-900 px-3 text-xs font-medium text-gray-500 uppercase">Or Paste</span>
                                </div>
                            </div>

                            <textarea
                                value={documentContent}
                                onChange={(e) => setDocumentContent(e.target.value)}
                                placeholder="Raw document text will appear or can be pasted here..."
                                rows={6}
                                className="mt-4 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[13px] shadow-inner transition-shadow resize-none"
                                disabled={isFileReading}
                            />
                        </div>

                        {/* 2. Instructions Section */}
                        <div className="mb-2">
                             <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">2. AI Instructions</h3>
                             
                             <div className="flex flex-wrap gap-2 mb-3">
                                 {quickActions.map((action, idx) => (
                                     <button 
                                        key={idx} 
                                        onClick={() => setUserPrompt(action)}
                                        className="text-[11px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center gap-1.5 font-semibold shadow-sm border border-teal-100 dark:border-teal-900/50"
                                     >
                                        <ZapIcon className="w-3 h-3 text-amber-500" /> {action}
                                     </button>
                                 ))}
                             </div>
                             <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                placeholder="Describe what you want the AI to do (e.g., 'Extract the main entities and present as a table')."
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 text-[14px] shadow-inner resize-none transition-shadow"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/50 text-sm animate-in fade-in mb-4">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="mt-auto pt-4">
                            <ActionButton onClick={handleProcess} isLoading={isLoading} disabled={isFileReading || !documentContent.trim() || !userPrompt.trim()} icon={<BrainIcon className="w-5 h-5"/>} className="w-full text-base py-4 shadow-lg shadow-teal-500/20 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-[0.98] transition-all text-white">
                                { isFileReading ? 'Analyzing File...' : 'Process Document' }
                            </ActionButton>
                        </div>
                    </div>
                </div>

                {/* --- Output Column (Right) --- */}
                <div className="lg:col-span-7">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 flex flex-col h-full min-h-[500px] overflow-hidden relative">
                        
                        {/* Header Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 gap-4 sm:gap-0">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Processed Output</h3>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                {copySuccess && <span className="text-xs font-bold text-green-600 dark:text-green-400 animate-in fade-in mr-2">{copySuccess}</span>}
                                
                                <button onClick={handleCopyToClipboard} disabled={!processedContent} title="Copy Content" className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50">
                                    <CopyIcon className="w-5 h-5"/>
                                </button>
                                
                                <div className="relative">
                                    <ActionButton 
                                        onClick={() => setShowExportMenu(!showExportMenu)} 
                                        disabled={!processedContent}
                                        isLoading={isExporting} 
                                        className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
                                        icon={<ExportIcon className="w-4 h-4" />}
                                    >
                                        <span className="hidden sm:inline ml-1">Export</span>
                                        <ChevronDownIcon className="w-4 h-4 ml-1 opacity-70" />
                                    </ActionButton>

                                    {showExportMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-20 border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 mb-1">Export Format</div>
                                                <button onClick={() => handleExport('pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><PdfIcon className="w-4 h-4 text-red-500"/> PDF Document</button>
                                                <button onClick={() => handleExport('docx')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><DocxIcon className="w-4 h-4 text-blue-500"/> Word (.docx)</button>
                                                <button onClick={() => handleExport('pptx')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><PresentationIcon className="w-4 h-4 text-orange-500"/> PowerPoint (.pptx)</button>
                                                <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                                                <button onClick={() => handleExport('html')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><ExportIcon className="w-4 h-4 text-teal-500"/> HTML Webpage</button>
                                                <button onClick={() => handleExport('csv')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><CsvIcon className="w-4 h-4 text-green-600"/> Data Spreadsheet (CSV)</button>
                                                <button onClick={() => handleExport('md')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><MarkdownIcon className="w-4 h-4 text-gray-500"/> Markdown</button>
                                                <button onClick={() => handleExport('txt')} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><FileTextIcon className="w-4 h-4 text-gray-400"/> Plain Text</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow relative bg-white/50 dark:bg-gray-900/50 p-6 sm:p-8 overflow-y-auto">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center mb-4 relative">
                                        <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-2xl animate-spin"></div>
                                        <BrainIcon className="w-6 h-6 text-emerald-500 animate-pulse" />
                                    </div>
                                    <p className="font-bold text-gray-700 dark:text-gray-200">Reformatting Document...</p>
                                </div>
                            )}

                            <div ref={outputRef} className="h-full">
                                {!isLoading && processedContent ? (
                                    <div
                                        className="prose dark:prose-invert max-w-none prose-teal text-[15px] leading-relaxed animate-in fade-in zoom-in-95 duration-300 pb-10 custom-prose-tables"
                                        dangerouslySetInnerHTML={{ __html: processedContent }}
                                    />
                                ) : (
                                    !isLoading && (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 opacity-60 pb-10 mt-10">
                                             <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                                                <FileTextIcon className="w-12 h-12" />
                                            </div>
                                            <p className="text-lg font-medium">Ready for Processing</p>
                                            <p className="text-sm mt-1 max-w-[280px] text-center">Output will appear here. You can easily export or copy it as rich text.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             <style>{`
                .prose h1, .prose h2, .prose h3 { font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; letter-spacing: -0.02em; }
                .prose h1 { font-size: 1.6rem; color: #0f172a; }
                .dark .prose h1 { color: #f8fafc; }
                .prose h2 { font-size: 1.3rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.3em; }
                .dark .prose h2 { border-color: #334155; }
                .prose h3 { font-size: 1.1rem; }
                .prose p { margin-bottom: 1.2M; line-height: 1.7; }
                
                /* List styling */
                .prose ul, .prose ol { padding-left: 1.5rem; margin-bottom: 1.5em; }
                .prose li { position: relative; margin-bottom: 0.5em; }
                .prose ul { list-style-type: disc; }
                .prose ol { list-style-type: decimal; }
                
                /* Text elements */
                .prose strong { font-weight: 700; color: #0d9488; } /* Teal-600 */
                .dark .prose strong { color: #2dd4bf; } /* Teal-400 */
                .prose em { font-style: italic; }
                
                /* Tables (Premium Look) */
                .custom-prose-tables table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 1.5em; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e2e8f0; }
                .dark .custom-prose-tables table { border-color: #334155; }
                .custom-prose-tables th, .custom-prose-tables td { padding: 0.75em 1em; text-align: left; border-bottom: 1px solid #e2e8f0; }
                .dark .custom-prose-tables th, .dark .custom-prose-tables td { border-bottom-color: #334155; }
                .custom-prose-tables th { background-color: #f8fafc; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 0.8em; letter-spacing: 0.05em; }
                .dark .custom-prose-tables th { background-color: #0f172a; color: #cbd5e1; }
                .custom-prose-tables tr:last-child td { border-bottom: none; }
                .custom-prose-tables tr:nth-child(even) td { background-color: #fcfcfc; }
                .dark .custom-prose-tables tr:nth-child(even) td { background-color: #1e293b/30; }
                
                /* Code blocks */
                .prose pre { background-color: #f8fafc; padding: 1.25em; border-radius: 0.75rem; border: 1px solid #e2e8f0; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85em; }
                .dark .prose pre { background-color: #0f172a; border-color: #334155; }
             `}</style>
        </div>
    );
};