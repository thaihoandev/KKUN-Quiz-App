package com.kkunquizapp.QuizAppBackend.common.utils;

import com.vladsch.flexmark.ext.autolink.AutolinkExtension;
import com.vladsch.flexmark.ext.gfm.strikethrough.StrikethroughExtension;
import com.vladsch.flexmark.ext.gfm.tasklist.TaskListExtension;
import com.vladsch.flexmark.ext.footnotes.FootnoteExtension;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.ext.typographic.TypographicExtension;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.util.data.MutableDataSet;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class MarkdownProcessor {

    private final Parser parser;
    private final HtmlRenderer renderer;

    public MarkdownProcessor() {
        MutableDataSet options = new MutableDataSet();
        options.set(Parser.EXTENSIONS, Arrays.asList(
                AutolinkExtension.create(),
                TablesExtension.create(),
                StrikethroughExtension.create(),
                TaskListExtension.create(),
                FootnoteExtension.create(),
                TypographicExtension.create()
        ));
        options.set(HtmlRenderer.ESCAPE_HTML, false);
        options.set(HtmlRenderer.SOFT_BREAK, "<br />\n");

        this.parser = Parser.builder(options).build();
        this.renderer = HtmlRenderer.builder(options).build();
    }

    public String toHtml(String markdown) {
        if (markdown == null) return "";
        return renderer.render(parser.parse(markdown));
    }
}
