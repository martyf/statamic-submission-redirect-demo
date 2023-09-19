const ajaxForms = document.getElementsByClassName('ajax-form');

Array.from(ajaxForms).forEach((form) => {
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new FormData(form)
        })
            .then(res => res.json())
            .then((data) => {

                console.log(data);

                if (data['redirect']) {
                    // redirect
                    alert('redirect to: ' + data['redirect']);
                }
                else if (data['success']) {
                    // success, woo!
                    alert('success');
                }
                else if (data['error']) {
                    // there's a validation issue
                    alert('handle validation issue');
                } else {
                    // an unknown error
                    alert('unknown error');
                }
            })
            .catch((error) => {
                // a js error took place
                alert('js error');
            });
    });
});
