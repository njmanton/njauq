$(document).ready(function() {

  // auto clear message boxes after 5s
  window.setTimeout(function() {
    $('.btn-close').click();
  }, 5000);

  // open modal when clicking an image in a grid
  $('.grid img').on('click', function(e) {
    const _this = $(this);
    $('#modal-img').attr('src', _this.attr('src'));
    if ($('section').data('ans')) {
      $('#modal-ct').html(_this.data('at'));
      $('#modal-id').html("A" + _this.data('id'));
      $('#modal-ans').html("Link: " + _this.data('lt'));
    } else {
      $('#modal-id').html("Q" + _this.data('id'));
      $('#modal-ct').html(_this.data('ct'));
    }
    const mdl = new bootstrap.Modal('#hilite');
    mdl.show();
  });

  // on mousover show the other associated links
  $('#groups tr').on('mouseover', function(e) {
    const _this = $(this),
          gp = _this.data('group'),
          highlite = `group-${ gp }`;

    _this.children().addClass(highlite);
    const sel = `tr[data-gp="${ gp }"] td`;
    $(sel).addClass(highlite);
  });

  $('#groups tr').on('mouseout', function(e) {
    const _this = $(this);
    const gp = _this.data('group');
    const highlite = `group-${ gp }`;
    _this.children().removeClass(highlite);
    const sel = `tr[data-gp="${ gp }"] td`;
    $(sel).removeClass(highlite);
  });

  // handle the events when dragging an image to a new question
  let image_file = null;

  $('.drop_zone').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
        
    e.preventDefault();
    e.stopPropagation();

  }).on('dragover dragenter', function(e) {
    
    $(this).addClass('dragging');

  }).on('dragleave dragend', function(e) {
    
    $(this).removeClass('dragging');

  }).on('drop', function(e) {

    const _this = $(this);

    let { files } = e.originalEvent.dataTransfer;
    image_file = files[0];

    previewImage(image_file, _this);
    _this.data('fn', image_file.name);

  });

  // handle question form submissions;
  $('#qaccordion').on('submit', 'form', async function(e) {
    try {

      e.preventDefault();
      e.stopPropagation();

      const _this = $(this),
            qid = _this.data('qid'),
            wid = _this.data('wid');

      if (_this.attr('id') == 'links_form') {
        const _outcome = $('#outcome');
        _outcome.html('');
        const f = await fetch('/submitLinks', {
          method: 'POST',
          body: new FormData(_this.get(0))
        })
        if (await f.json()) {
          _outcome.html('Links Saved');
        } else {
          _outcome.html('Please check - not all links were updated');
        }
        return;
      }

      if (validate(_this)) {
        const fd = new FormData(_this.get(0));
        if (image_file) fd.append('image', image_file);

        fetch('/submit', {
          method: 'POST',
          body: fd
        }).then(async r => {
          if (r.status != 200) {
            $(`#status${ qid }]`).html(`<span color="red">There was an error saving the image</span>`);
          } else {
            const resp = await r.json();
            const fn = `/img/week${ wid }/${ qid }.jpg`;
            const str = `Q${ qid } Saved. <a role="button" tabindex="0" id="details${ qid }" class="popover_a" data-bs-toggle="popover" data-bs-trigger="focus">File Details</a>`;
            $(`#status${ qid }`).html(str);
            _this.parent().addClass('cell-saved');
            new bootstrap.Popover(document.getElementById(`details${ qid }`), { 
              html: true,
              content: `Image saved as <code>${ fn }</code><br>Original File: <code>${ resp.stats.old_dimensions} / ${ resp.stats.old_size }</code><br>New File: <code>${ resp.stats.new_dimensions } / ${ resp.stats.new_size }</code><br>${ resp.stats.reduction }x size reduction. <a target="_blank" href="${ fn }">Preview &#x29c9;</a>`,
              title: `File details` 
            });
          }
        });

      } else {
        console.log('invalid');
      }

    } catch (error) {
      console.error(`error (${ error })`);
    }
  });

  // function to show preview of a dropped image
  const previewImage = (file, tar) => {
    // preview the file in the drop box
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', e => {
      const html = `<img src="${ e.target.result }" style="width: 100%; height: 100%;" alt="${ file.name }">`;
      tar.html(html);
    })
  }

  // ensure each form is valid
  const validate = form => {
    // browser should take care of ans/lt required fields. Need to check image and select box

    const data = form.serializeArray();
    let valid = true;
    const gp = data.find(({ name }) => name == 'group');
    const temp = ['A','B','C','D','E'].includes(gp.value);
    return valid && temp;
  }

})

