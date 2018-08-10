#target indesign;

var images = []
var window = null
main()

function getCromalinPage(width, height) {
    var cromalinDoc = app.documents.add()
    with(cromalinDoc.documentPreferences) {
        pageHeight = height
        pageWidth = width
        pageOrientation = PageOrientation.portrait
    }
    return cromalinDoc.pages.item(0)
}

function main() {
    if (!app.activeDocument) {
        alert("You must have one active document.")
        return
    }
    var source = app.activeDocument

    window = new Window('palette', 'Cromalin generator', undefined, { closeButton: false })
    window.add(
        'statictext',
        [0, 0, 400, 50],
        source.splineItems.length + " item(s) to extract images from.",
        {"multiline": true}
    )
    window.pbarSplines = window.add('progressbar', undefined, 0, source.splineItems.length)
    window.pbarSplines.preferredSize.width = 400

    var startBtn = window.add('button', undefined, "Start")
    startBtn.onClick = function () {
        var cromalinPage = getCromalinPage("42cm", "100cm")
        extractImages(source.splineItems, cromalinPage, window.pbarSplines)
        alert("Cromalin generator\n" + 'Done! ' + images.length + ' images copied.')
        window.close()
    }

    window.show()
}

function extractItemWithImage(item, destPage) {
    if (item.graphics.length > 0) {
        images.push(item)
        return item.duplicate(destPage)
    }
    return
}

function extractImages(items, destPage, progressBar) {
    for(i = items.length - 1; i >= 0; i--) {
        extractItemWithImage(items.item(i), destPage)
        if (progressBar) {
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