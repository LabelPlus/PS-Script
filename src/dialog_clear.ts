/// <reference path="legacy.d.ts" />

namespace LabelPlus {

function getColor(doc: Document, x: UnitValue, y: UnitValue): SolidColor
{
    let sample = doc.colorSamplers.add([x, y]);
    let color = sample.color;
    sample.remove();
    return color;
}

function isSelectionValid()
{
    try {
        let bounds = app.activeDocument.selection.bounds; // if no selection, raise error

        let bound_width = bounds[2].as('pt') - bounds[0].as('pt');
        let bound_height = bounds[3].as('pt') - bounds[1].as('pt');

        log("select bounds: " + bounds.toString() + "bound_width=" + bound_width + " bound_height=" + bound_height);
        if ((bound_width < 20) || (bound_height < 20)) {
            log("selection too small...");
            return false;
        }

        return true;
    }
    catch (e) {
        log("no selection...");
        return false;
    }
}

// clear dialog
//      bgLayer: the background layer
//      overLayer: the overlay layer
//      labels: label (x,y) coordinate
//      tolerance: magicwand's tolerance
//      contract: contract selected area, for protect the edge of dialog box
export function dialogClear(doc: Document, bgLayer: ArtLayer, overLayer: ArtLayer,
                            labels: Array<{ x: number, y: number }>,
                            tolerance: number, contract: UnitValue): boolean
{
    let width = doc.width.as("px");
    let height = doc.height.as("px");

    let tmp_color = new SolidColor;
    tmp_color.rgb.red = 255;
    tmp_color.rgb.green = 0;
    tmp_color.rgb.blue = 255;

    for (let i = 0; i < labels.length; i++) {
        let x = labels[i].x * width;
        let y = labels[i].y * height;
        let fill_color = getColor(doc, UnitValue(x, 'px'), UnitValue(y, 'px'));

        log("point " + i + "(" + x + "," + y + ") color=" + fill_color.rgb.hexValue.toString());

        app.activeDocument.activeLayer = bgLayer;
        doc.selection.deselect();
        MyAction.magicWand(x, y, tolerance, false, true, 'addTo');

        let tmp_layer = doc.artLayers.add();
        app.activeDocument.activeLayer = tmp_layer;
        doc.selection.fill(tmp_color, ColorBlendMode.NORMAL, 100, false);
        doc.selection.deselect();
        let corners : { x: number, y: number }[]= [
            { x: 0, y: 0 },
            { x: width - 1, y: 0 },
            { x: 0, y: height -1 },
            { x: width - 1, y: height -1 },
        ];
        for (let j = 0; j < corners.length; j++) {
            let x = corners[j].x;
            let y = corners[j].y;
            let color = getColor(doc, UnitValue(x, 'px'), UnitValue(y, 'px'));
            if (color.rgb.hexValue == tmp_color.rgb.hexValue) {
                log("detect corner (" + x + "," + y + ") is tmp_color");
                continue;
            }
            MyAction.magicWand(x, y, 0, false, true, 'addTo');
        }

        tmp_layer.remove();

        doc.selection.invert();
        if (isSelectionValid()) {
            doc.selection.contract(contract);

            app.activeDocument.activeLayer = overLayer;
            doc.selection.fill(fill_color, ColorBlendMode.NORMAL, 100, false);
        }
        else {
            log("selection is not valid, ignore...");
        }
    }
    return true;
}

} // namespace LabelPlus
