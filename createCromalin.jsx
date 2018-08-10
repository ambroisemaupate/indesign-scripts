#targetengine "session"

var images = []
var source = null
var window = null
var kill = false
var docWidth = 0
var docHeight = 0
var cromalinDoc = null

Packer = function(w, h) {
  this.init(w, h);
};

Packer.prototype = {
  init: function(w, h) {
    this.root = { x: 0, y: 0, w: w, h: h };
  },

  fit: function(blocks) {
    var n, node, block;
    for (n = 0; n < blocks.length; n++) {
      block = blocks[n];
      if (null !== node = this.findNode(this.root, block.w, block.h)) {
        block.fit = this.splitNode(node, block.w, block.h);
      } else {
        block.fit = null
      }
    }
  },

  findNode: function(root, w, h) {
    if (root.used) {
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    } else if ((w <= root.w) && (h <= root.h)) {
      return root;
    } else {
      return null;
    }
  },

  splitNode: function(node, w, h) {
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
  }
}

Sort = {
    random  : function (a,b) { return Math.random() - 0.5; },
    w       : function (a,b) { return b.w - a.w; },
    h       : function (a,b) { return b.h - a.h; },
    a       : function (a,b) { return b.area - a.area; },
    max     : function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
    min     : function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },

    height  : function (a,b) { return Sort.msort(a, b, ['h', 'w']);               },
    width   : function (a,b) { return Sort.msort(a, b, ['w', 'h']);               },
    area    : function (a,b) { return Sort.msort(a, b, ['a', 'h', 'w']);          },
    maxside : function (a,b) { return Sort.msort(a, b, ['max', 'min', 'h', 'w']); },

    msort: function(a, b, criteria) { /* sort by multiple criteria */
      var diff, n;
      for (n = 0 ; n < criteria.length ; n++) {
        diff = Sort[criteria[n]](a,b);
        if (diff != 0)
          return diff;
      }
      return 0;
    },

    now: function(blocks, sort) {
      if (sort != 'none')
        blocks.sort(Sort[sort]);
    }
}

main()

function getCromalinPage(width, height) {
    cromalinDoc = app.documents.add()
    with(cromalinDoc.documentPreferences) {
        pageHeight = height
        pageWidth = width
        facingPages = false
        pageOrientation = PageOrientation.portrait
    }
    return cromalinDoc.pages.item(0)
}

function launch() {
    window.startBtn.enabled = false
    docWidth = window.documentPanel.te_width.text
    docHeight = window.documentPanel.te_height.text
    var cromalinPage = getCromalinPage(
        docWidth,
        docHeight
    )
    extractImages(source.splineItems, cromalinPage, window.pbarSplines)
    //alert("Cromalin generator\n" + 'Done! ' + images.length + ' images copied.')
    window.pbarImagesLabel.text = images.length + " item(s) to arrange."
    window.pbarImages.maxvalue = images.length
    arrange(images, window.pbarImages, docWidth, docHeight, cromalinPage)

    alert("Cromalin generator\n" + 'Done! ' + images.length + ' images copied.')
}

function extractItemWithImage(item, destPage) {
    if (item.graphics.length > 0) {
        return images.push(item.duplicate(destPage))
    }
    return
}

function extractImages(items, destPage, progressBar) {
    for(i = items.length - 1; i >= 0; i--) {
        extractItemWithImage(items.item(i), destPage)
        if (progressBar) {
            progressBar.value++
        }
    }
}

function extractGroupImages(groups, destPage, progressBar) {
    for(i = 0; i < groups.length; i++) {
        var group = groups.item(i)
        if (group.splineItems.length > 0) {
            extractImages(group.splineItems, destPage, progressBar)
        }
    }
}

function main() {
    if (!app.activeDocument) {
        alert("You must have one active document.")
        return
    }
    source = app.activeDocument
    //window = app.dialogs.add({name:"Cromalin generator"});
    //
    windowResource = "palette {  \
        orientation: 'column', \
        alignChildren: ['fill', 'top'],  \
        preferredSize:[400, 130], \
        text: 'Cromalin generator',  \
        margins:15, \
        documentPanel: Panel { \
            orientation: 'row', \
            alignChildren: 'right', \
            margins:15, \
            text: 'Page size', \
            st_width: StaticText { text: 'Width (mm):' }, \
            te_width: EditText { text: '420', characters: 10, justify: 'left'}, \
            st_height: StaticText { text: 'Height (mm):' }, \
            te_height: EditText { text: '1000', characters: 10, justify: 'left'} \
        }, \
        marginPanel: Panel { \
            orientation: 'row', \
            alignChildren: 'right', \
            margins:15, \
            text: 'Items properties', \
            st_item_margin: StaticText { text: 'Margin (mm):' }, \
            te_item_margin: EditText { text: '3', characters: 10, justify: 'left'} \
        }\
    }"

    window = new Window(windowResource)
    window.add(
        'statictext',
        [0, 0, 400, 25],
        source.splineItems.length + " item(s) to extract images from.",
        {"multiline": true}
    )
    window.pbarSplines = window.add('progressbar', undefined, 0, source.splineItems.length)
    window.pbarSplines.preferredSize.width = 400

    window.pbarImagesLabel = window.add(
        'statictext',
        undefined,
        images.length + " item(s) to arrange.",
        {"multiline": true}
    )
    window.pbarImages = window.add('progressbar', undefined, 0, images.length)
    window.pbarImages.preferredSize.width = 400

    window.startBtn = window.add('button', undefined, "Start")
    window.startBtn.addEventListener('click', launch, false)

    return window.show()
}

function arrange(images, progressBar, destWidth, destHeight, currentPage) {
    var margin = Number(window.marginPanel.te_item_margin.text)
    var items = []
    for (i = images.length - 1; i >= 0; i--) {
        var imageData = getItemWrapper(images[i], margin)
        items.push(imageData)
    }

    fitItems(items, progressBar, destWidth, destHeight, currentPage, margin)
}

function fitItems(items, progressBar, docWidth, docHeight, currentPage, margin) {
    var packer = new Packer(docWidth, docHeight)
    var remaningItems = []
    Sort.now(items, "maxside");
    packer.fit(items)
    var itemsLength = items.length

    for (var n = 0 ; n < itemsLength ; n++) {
        var itemData = items[n]
        if (null !== itemData.fit) {
            itemData.item.move([itemData.fit.x + margin, itemData.fit.y + margin])
            progressBar.value++
        } else {
            remaningItems.push(itemData)
        }
    }

    if (remaningItems.length > 0) {
        var newPage = cromalinDoc.pages.add(LocationOptions.AFTER, currentPage)

        for (var n = remaningItems.length - 1 ; n >=0 ; n--) {
            remaningItems[n].item.move(newPage)
        }

        fitItems(remaningItems, progressBar, docWidth, docHeight, newPage, margin)
    }
}

function getItemWrapper(item, margin) {
    return {
        item: item,
        w: getItemWidth(item, margin),
        h: getItemHeight(item, margin)
    }
}

function getItemWidth(item, margin) {
    return (item.geometricBounds[3] - item.geometricBounds[1]) + (2 * margin)
}

function getItemHeight(item, margin) {
    return (item.geometricBounds[2] - item.geometricBounds[0]) + (2 * margin)
}