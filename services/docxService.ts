import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import FileSaver from 'file-saver';

// Helper to remove emojis and decorative symbols
const cleanText = (text: string): string => {
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

// Helper to parse a line and return TextRuns (handling **bold** syntax)
const parseLineToRuns = (text: string, isBoldOverride: boolean = false): TextRun[] => {
  const cleaned = cleanText(text);
  const parts = cleaned.split(/(\*\*.*?\*\*)/g); // Split by **text**

  return parts
    .filter(part => part !== "")
    .map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({
          text: part.slice(2, -2), // Remove **
          bold: true,
          font: "Times New Roman",
          size: 28, // 14pt
        });
      }
      // Handle potential leftover single markdown chars like * or _ if necessary, usually cleanText handles emojis
      // But we strictly just return text here.
      return new TextRun({
        text: part,
        bold: isBoldOverride,
        font: "Times New Roman",
        size: 28, // 14pt
      });
    });
};

// Types for Section parsing
interface ActivityItem {
  title: string;
  teacherContent: string[];
  childContent: string[];
}

export const exportToWord = async (content: string, fileName: string = "Giao_an_Mam_non") => {
  const lines = content.split('\n');
  const docChildren: any[] = []; // Allow Paragraph or Table

  let inTableSection = false;
  let activityBuffer: ActivityItem[] = [];
  let currentActivity: ActivityItem | null = null;
  let currentFocus: 'teacher' | 'child' | null = null;

  // Function to flush the table
  const flushTableSection = () => {
    if (activityBuffer.length === 0) return;

    const tableRows: TableRow[] = [];

    // Header Row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ 
                children: [new TextRun({ text: "Hoạt động của cô", bold: true, font: "Times New Roman", size: 28 })],
                alignment: AlignmentType.CENTER 
            })],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ 
                children: [new TextRun({ text: "Hoạt động của trẻ", bold: true, font: "Times New Roman", size: 28 })],
                alignment: AlignmentType.CENTER 
            })],
          }),
        ],
      })
    );

    // Content Rows
    activityBuffer.forEach(act => {
       // Combine Title and Teacher content in Col 1
       const col1Children: Paragraph[] = [];
       // Add Title in Bold
       col1Children.push(new Paragraph({
           children: parseLineToRuns(act.title, true), // Bold title
           spacing: { after: 120 }
       }));
       // Add Teacher content paragraphs
       act.teacherContent.forEach(text => {
           col1Children.push(new Paragraph({
               children: parseLineToRuns(text),
               spacing: { after: 120 }
           }));
       });

       // Col 2: Child content
       const col2Children: Paragraph[] = [];
       
       if (act.childContent.length > 0) {
            act.childContent.forEach(text => {
                col2Children.push(new Paragraph({
                    children: parseLineToRuns(text),
                    spacing: { after: 120 }
                }));
            });
       } else {
           col2Children.push(new Paragraph({ text: "" }));
       }

       tableRows.push(new TableRow({
           children: [
               new TableCell({
                   children: col1Children,
                   width: { size: 60, type: WidthType.PERCENTAGE },
                   verticalAlign: 'center'
               }),
               new TableCell({
                   children: col2Children,
                   width: { size: 40, type: WidthType.PERCENTAGE },
                   verticalAlign: 'center'
               })
           ]
       }));
    });

    const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
        }
    });

    docChildren.push(table);
    
    // Reset state
    activityBuffer = [];
    currentActivity = null;
    currentFocus = null;
    inTableSection = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for "3. Tiến hành" start -> Start Table Mode
    // Matches: ### 3. Tiến hành OR **3. Tiến hành**
    if (trimmedLine.toLowerCase().includes('tiến hành') && (trimmedLine.startsWith('###') || trimmedLine.startsWith('**3.'))) {
       const text = cleanText(trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, ''));
       docChildren.push(
        new Paragraph({
            children: [new TextRun({ text: text, bold: true, font: "Times New Roman", size: 28 })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 240, after: 120, line: 360 },
        })
       );
       inTableSection = true;
       continue;
    }

    // Check for End of Table Section
    // Stops if we hit a new Heading 1 (#) or Heading 2 (##) like "III. HOẠT ĐỘNG..."
    if (inTableSection && (trimmedLine.startsWith('## ') || trimmedLine.startsWith('# '))) {
        flushTableSection();
        // Fall through to process this header line normally
    }

    if (inTableSection) {
        if (!trimmedLine) continue;

        // Activity Title detection (#### 1. ... or ### 1. ...)
        // We support both #### and ### inside table section to be robust
        if (trimmedLine.startsWith('#### ') || trimmedLine.startsWith('### ')) {
            // Save previous activity
            if (currentActivity) {
                activityBuffer.push(currentActivity);
            }
            // Start new activity
            const titleRaw = trimmedLine.replace(/^####\s*/, '').replace(/^###\s*/, '');
            currentActivity = {
                title: cleanText(titleRaw),
                teacherContent: [],
                childContent: []
            };
            currentFocus = 'teacher'; // Default focus
            continue;
        }

        // Teacher/Child marker detection
        // Matches: "- **Cô**: ..." or "* **Trẻ**: ..."
        const teacherMatch = trimmedLine.match(/^[\-\*]?\s*(?:\*\*)?(?:Cô|Cô giáo|Giáo viên)(?:\*\*)?\s*:\s*(.*)/i);
        const childMatch = trimmedLine.match(/^[\-\*]?\s*(?:\*\*)?(?:Trẻ|Học sinh|Cả lớp)(?:\*\*)?\s*:\s*(.*)/i);

        if (teacherMatch) {
            currentFocus = 'teacher';
            if (currentActivity) currentActivity.teacherContent.push(teacherMatch[1]);
            continue;
        }

        if (childMatch) {
            currentFocus = 'child';
            if (currentActivity) currentActivity.childContent.push(childMatch[1]);
            continue;
        }

        // Continuation text
        if (currentActivity && currentFocus) {
             const cleanContent = cleanText(trimmedLine.replace(/^[\-\*]\s+/, ''));
             if (currentFocus === 'teacher') currentActivity.teacherContent.push(cleanContent);
             else currentActivity.childContent.push(cleanContent);
        } else if (currentActivity) {
             const cleanContent = cleanText(trimmedLine.replace(/^[\-\*]\s+/, ''));
             // Default to teacher if no explicit marker yet (start of an activity description)
             if (!currentFocus) currentFocus = 'teacher';
             if (currentFocus === 'teacher') currentActivity.teacherContent.push(cleanContent);
             else currentActivity.childContent.push(cleanContent);
        }
        continue;
    }

    // --- NORMAL PROCESSING (Outside Table Section) ---
    
    if (!trimmedLine) {
        docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        continue;
    }

    // 1. Heading Level 1 (# TÊN HOẠT ĐỘNG)
    if (trimmedLine.startsWith('# ')) {
      const text = cleanText(trimmedLine.substring(2));
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: text.toUpperCase(), bold: true, font: "Times New Roman", size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240, line: 360 },
        })
      );
      continue;
    }

    // 2. Heading Level 2 (## I. THÔNG TIN CHUNG, ## II. HOẠT ĐỘNG HỌC...)
    if (trimmedLine.startsWith('## ')) {
      const text = cleanText(trimmedLine.substring(3));
      docChildren.push(
        new Paragraph({
            children: [new TextRun({ text: text.toUpperCase(), bold: true, font: "Times New Roman", size: 28 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 240, after: 120, line: 360 },
        })
      );
      continue;
    }

    // 3. Heading Level 3 (### 1. Mục đích, ### 2. Chuẩn bị)
    if (trimmedLine.startsWith('### ')) {
       const text = cleanText(trimmedLine.substring(4));
       docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: text, bold: true, font: "Times New Roman", size: 28 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360 },
        })
      );
      continue;
    }
    
    // 4. Heading Level 4 (####) - Fallback if not in table mode
    if (trimmedLine.startsWith('#### ')) {
       const text = cleanText(trimmedLine.substring(5));
       docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: text, bold: true, font: "Times New Roman", size: 28 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360 },
        })
      );
      continue;
    }

    // 5. Bold Line (**...**)
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      const cleanLine = trimmedLine.replace(/\*\*/g, '');
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: cleanText(cleanLine), bold: true, font: "Times New Roman", size: 28 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360 },
        })
      );
      continue;
    }

    // 6. List Items (* Item or - Item)
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      // Remove the markdown bullet (* or -) and use a standard dash or bullet character text
      const text = trimmedLine.substring(2);
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: "- " + cleanText(text), font: "Times New Roman", size: 28 })],
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 720, hanging: 360 },
          spacing: { line: 360 },
        })
      );
      continue;
    }

    // 7. Numbered Lists
    if (/^\d+\./.test(trimmedLine)) {
         docChildren.push(
            new Paragraph({
              children: parseLineToRuns(trimmedLine),
              alignment: AlignmentType.JUSTIFIED,
              indent: { left: 720, hanging: 360 },
              spacing: { line: 360 },
            })
          );
        continue;
    }

    // 8. Normal Paragraph
    docChildren.push(
      new Paragraph({
        children: parseLineToRuns(trimmedLine),
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360 },
      })
    );
  }

  // Flush if Table was the last part
  if (inTableSection) {
      flushTableSection();
  }

  // Create Document
  const doc = new Document({
    sections: [
      {
        properties: {
            page: {
                size: {
                    orientation: "portrait" as any,
                    height: 16838, // A4 height in twips
                    width: 11906,  // A4 width in twips
                },
                margin: {
                    top: 1134,    // 2 cm
                    bottom: 1134, // 2 cm
                    left: 1701,   // 3 cm
                    right: 1134,  // 2 cm
                },
            },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  // @ts-ignore
  const saveAs = FileSaver.saveAs || FileSaver;
  saveAs(blob, `${fileName}.docx`);
};